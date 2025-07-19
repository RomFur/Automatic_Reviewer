-- Create a MySQL DB before using app
CREATE DATABASE IF NOT EXISTS articles_db;
USE articles_db;

CREATE TABLE IF NOT EXISTS articles (
	ut VARCHAR(50) PRIMARY KEY,
    title TEXT NOT NULL,
    year INT,
    sport VARCHAR(100),
    population TEXT,
    technology TEXT,
    outcome TEXT
);
