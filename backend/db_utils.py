import mysql.connector
import csv

def initialize_database(
    host: str,
    user: str,
    password: str,
    database: str
) -> None:
    """Create the database and articles table if they don't exist."""
    # Connect without specifying a database first (to create the DB)
    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
    )
    cursor = conn.cursor()

    # Create database if not exists
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
    # Select the database
    cursor.execute(f"USE {database}")

    # Create articles table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        ut VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        year INT,
        sport VARCHAR(100),
        population TEXT,
        technology TEXT,
        outcome TEXT
    )
    """)

    conn.commit()
    cursor.close()
    conn.close()

def insert_articles_from_csv(
    csv_file_path: str,
    host: str,
    user: str,
    password: str,
    database: str
) -> None:
    """Insert or ignore rows from article_output.csv into MySQL."""
    initialize_database(host, user, password, database)

    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
    )
    cursor = conn.cursor()

    with open(csv_file_path, newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
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
    host: str,
    user: str,
    password: str,
    database: str,
    sport: str = None,
    start_year: int = None,
    end_year: int = None,
    technology: str = None,
    outcome: str = None,
    population: str = None,
):
    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
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



def fetch_all_articles(
    host: str,
    user: str,
    password: str,
    database: str,
):
    conn = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM articles")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows
