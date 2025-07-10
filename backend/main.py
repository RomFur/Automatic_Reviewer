from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import os
from article_processor import process_articles
from db_utils import insert_articles_from_csv


app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
