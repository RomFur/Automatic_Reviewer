from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import os
from article_processor import process_articles
from db_utils import insert_articles_from_csv, fetch_all_articles, fetch_articles_filtered
from choices import SPORT_CHOICES, TECH_CHOICES, POP_CHOICES, OUT_CHOICES


app = FastAPI()

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
def get_all_articles():
    return fetch_all_articles()


@app.get("/articles/filter/")
def filter_articles(
    sport: str = None,
    start_year: int = None,
    end_year: int = None,
    technology: str = None,
    outcome: str = None,
    population: str = None
):
    return fetch_articles_filtered(
        sport=sport,
        start_year=start_year,
        end_year=end_year,
        technology=technology,
        outcome=outcome,
        population=population,
    )

@app.post("/process-articles/")
async def process_articles_endpoint(file: UploadFile = File(...)):
    input_file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file
    with open(input_file_path, "wb") as buffer:
        buffer.write(await file.read())

    output_csv_path = os.path.join(UPLOAD_DIR, "article_output.csv")

    # Process articles asynchronously
    output_file, total_articles = await process_articles(input_file_path, output_csv_path)

    insert_articles_from_csv(output_csv_path)

    return FileResponse(
        output_file,
        media_type="text/csv",
        filename="article_output.csv"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
