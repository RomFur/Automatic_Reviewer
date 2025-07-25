from fastapi import FastAPI, File, UploadFile, Header
from fastapi.responses import FileResponse
import os
import json
from article_processor import process_articles
from db_utils import insert_articles_from_csv, fetch_all_articles, fetch_articles_filtered
from choices import SPORT_CHOICES, TECH_CHOICES, POP_CHOICES, OUT_CHOICES
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/choices/")
def get_all_choices():
    return {
        "sports": SPORT_CHOICES,
        "technologies": TECH_CHOICES,
        "populations": POP_CHOICES,
        "outcomes": OUT_CHOICES,
    }

@app.get("/articles/")
def get_all_articles(
    x_db_host: str = Header(..., alias="x-db-host"),
    x_db_user: str = Header(..., alias="x-db-user"),
    x_db_password: str = Header(..., alias="x-db-password"),
    x_db_database: str = Header(..., alias="x-db-database"),
):
    articles = fetch_all_articles(x_db_host, x_db_user, x_db_password, x_db_database)

    outcomes = extract_unique_terms(articles, "outcome", is_json_list=False)
    populations = extract_unique_terms(articles, "population", is_json_list=False)
    technologies = extract_unique_terms(articles, "technology", is_json_list=True)
    sports = sorted({a["sport"] for a in articles if a.get("sport") and a["sport"] != "None"})
    years = sorted({a["year"] for a in articles if a.get("year")})

    return {
        "articles": articles,
        "filters": {
            "outcomes": outcomes,
            "sports": sports,
            "populations": populations,
            "technologies": technologies,
            "years": years,
        },
    }


@app.get("/articles/filter/")
def filter_articles(
    sport: str = None,
    start_year: int = None,
    end_year: int = None,
    technology: str = None,
    outcome: str = None,
    population: str = None,
    x_db_host: str = Header(..., alias="x-db-host"),
    x_db_user: str = Header(..., alias="x-db-user"),
    x_db_password: str = Header(..., alias="x-db-password"),
    x_db_database: str = Header(..., alias="x-db-database"),
):
    return fetch_articles_filtered(
        host=x_db_host,
        user=x_db_user,
        password=x_db_password,
        database=x_db_database,
        sport=sport,
        start_year=start_year,
        end_year=end_year,
        technology=technology,
        outcome=outcome,
        population=population,
    )

@app.post("/process-articles/")
async def process_articles_endpoint(
    file: UploadFile = File(...),
    x_db_host: str = Header(..., alias="x-db-host"),
    x_db_user: str = Header(..., alias="x-db-user"),
    x_db_password: str = Header(..., alias="x-db-password"),
    x_db_database: str = Header(..., alias="x-db-database"),
):
    input_file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(input_file_path, "wb") as buffer:
        buffer.write(await file.read())

    output_csv_path = os.path.join(UPLOAD_DIR, "article_output.csv")
    output_file, total_articles = await process_articles(input_file_path, output_csv_path)

    insert_articles_from_csv(output_csv_path, x_db_host, x_db_user, x_db_password, x_db_database)

    return FileResponse(
        output_file,
        media_type="text/csv",
        filename="article_output.csv"
    )

def extract_unique_terms(articles, field, is_json_list=True):
    terms = set()
    for a in articles:
        raw = a.get(field)
        if not raw:
            continue
        try:
            if is_json_list:
                parsed = json.loads(raw) if isinstance(raw, str) else raw
                if isinstance(parsed, list):
                    for item in parsed:
                        if item.strip() and item != "None":
                            terms.add(item.strip())
            else:
                # Split by comma for plain text fields
                for item in raw.split(","):
                    if item.strip() and item != "None":
                        terms.add(item.strip())
        except Exception:
            continue
    return sorted(terms)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
