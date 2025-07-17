import mysql.connector
import csv

def insert_articles_from_csv(csv_file_path: str) -> None:
    """Insert or ignore rows from article_output.csv into MySQL."""
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="articles_db",
    )
    cursor = conn.cursor()

    with open(csv_file_path, newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            # Clean / normalise as necessary
            try:
                cursor.execute(
                    """
                    INSERT IGNORE INTO articles
                        (ut, title, year, sport, population, technology, outcome)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        row.get("ut"),
                        row.get("title"),
                        int(row["year"]) if row.get("year") else None,
                        row.get("sport"),
                        row.get("population"),   # <-- NEW
                        row.get("technology"),
                        row.get("outcome"),      # <-- NEW
                    ),
                )
            except Exception as exc:
                print(f"[INSERT‑ERROR] UT={row.get('ut')} → {exc}")

    conn.commit()
    cursor.close()
    conn.close()
