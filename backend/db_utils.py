import mysql.connector
import csv

def insert_articles_from_csv(csv_file_path):
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",  
        database="articles_db"
    )
    cursor = conn.cursor()

    with open(csv_file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                cursor.execute("""
                    INSERT IGNORE INTO articles (title, year, ut, sport, technology, p, i, c, o)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    row['title'],
                    int(row['year']) if row['year'] else None,
                    row['ut'],
                    row['sport'],
                    row['technology'],
                    row['p'],
                    row['i'],
                    row['c'],
                    row['o']
                ))
            except Exception as e:
                print(f"Error inserting row with UT={row['ut']}: {e}")

    conn.commit()
    cursor.close()
    conn.close()
