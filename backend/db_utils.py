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
                        row.get("population"), 
                        row.get("technology"),
                        row.get("outcome"),  
                    ),
                )
            except Exception as exc:
                print(f"[INSERT‑ERROR] UT={row.get('ut')} → {exc}")

    conn.commit()
    cursor.close()
    conn.close()

def fetch_articles_filtered(
    sport: str = None,
    start_year: int = None,
    end_year: int = None,
    technology: str = None,
    outcome: str = None,
    population: str = None,
):
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="articles_db",
    )
    cursor = conn.cursor(dictionary=True)

    query = "SELECT * FROM articles WHERE 1=1"
    params = []

    if sport:
        query += " AND sport = %s"
        params.append(sport)

    if start_year:
        query += " AND year >= %s"
        params.append(start_year)

    if end_year:
        query += " AND year <= %s"
        params.append(end_year)

    if technology:
        query += " AND technology LIKE %s"
        params.append(f"%{technology}%")

    if outcome:
        query += " AND outcome LIKE %s"
        params.append(f"%{outcome}%")

    if population:
        query += " AND population LIKE %s"
        params.append(f"%{population}%")

    query += " ORDER BY year"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    cursor.close()
    conn.close()
    return rows


def fetch_all_articles():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="articles_db",
    )
    cursor = conn.cursor(dictionary=True)  
    cursor.execute("SELECT * FROM articles")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows