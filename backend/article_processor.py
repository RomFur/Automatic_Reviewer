import csv
import re
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
import os

def parse_articles(text: str):
    raw_articles = text.strip().split('ER\n\n')
    articles = []
    for raw_article in raw_articles:
        if not raw_article.strip():
            continue

        if not re.search(r'^TI ', raw_article, re.MULTILINE):
            continue

        title_match = re.search(r'^TI (.+?)(?=\n[A-Z]{2} |\n$)', raw_article, re.MULTILINE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else "No title"

        abstract_match = re.search(r'^AB (.+?)(?=\n[A-Z]{2} |\n$)', raw_article, re.MULTILINE | re.DOTALL)
        abstract = abstract_match.group(1).strip() if abstract_match else "No abstract"

        year_match = re.search(r'^PY (\d{4})', raw_article, re.MULTILINE)
        year = year_match.group(1) if year_match else "Unknown"

        ut_match = re.search(r'^UT (.+)', raw_article, re.MULTILINE)
        ut = ut_match.group(1).strip() if ut_match else "Unknown"

        articles.append((title, abstract, year, ut))

    return articles

def extract_info_from_response(response: str):
    sport_match = re.search(r"\|\s*.+?\s*\|\s*\{(.+?)\}\s*\|", response)
    tech_match = re.search(r"\|\s*.+?\s*\|\s*\{.+?\}\s*\|\s*\d{4}\s*\|\s*(.+?)\s*\|", response)

    sport = sport_match.group(1).strip().lower() if sport_match else "unknown"
    technology = tech_match.group(1).strip() if tech_match else "unknown"

    return sport, technology

def extract_pico_from_response(response: str):
    def extract(field):
        match = re.search(rf"{field}:(.*)", response, re.IGNORECASE)
        if match:
            return match.group(1).strip().replace("{", "").replace("}", "").replace("None", "").strip()
        return ""

    p = extract('P')
    i = extract('I')
    c = extract('C')
    o = extract('O')

    return p, i, c, o

classification_prompt_template = """
You will be given a list of article titles, publication years, and abstracts. 
Your task is to identify the sport the provided article is **primarily about**.

Only classify an article if the sport is the main focus of the study. 
Do not classify based on incidental mentions or comparisons.

Identify any **technology** areas that the article focuses on.
   - Focus on tangible research tools, measurement technologies, data collection, modeling, sensors, AI systems, software frameworks, etc.
   - Examples include: wearables, GPS, AI, computer vision, video analysis, machine learning, sensors, biomechanics, force plates, EMG, motion capture, etc.
   - Do **not** list general outcome variables (like "heart rate variability") unless a measurement technology is used to capture them (e.g., ECG, wearables).
   - If multiple technologies are involved, separate them with commas.
   - If no technology focus is evident, write {{None}}.

Return a markdown table with 4 columns:
1. Short title
2. The sport in curly braces like {{Soccer}}. Use {{Unknown}} if unclear.
3. Publishing year.
4. Technology.

### Article ###

Title: {title}
Year: {year}
Abstract: {abstract}

### Result ###
"""

pico_prompt_template = """
You will be given the title and abstract of a research article. Extract the following PICO elements:

P = Population / Participants / Subjects
I = Intervention / Exposure / Index factor
C = Comparison / Control (if any)
O = Outcome(s) studied

If a component does not exist or cannot be identified, write {{None}}.

### Article ###

Title: {title}
Abstract: {abstract}

### PICO Extraction ###

P: ...
I: ...
C: ...
O: ...
"""

async def process_articles(input_file_path: str, output_csv_path: str):
    with open(input_file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    articles = parse_articles(text)
    llm = Ollama(model="gemma3")

    results = []

    for title, abstract, year, ut in articles:
        # Classification step
        classification_prompt = PromptTemplate(
            input_variables=["title", "year", "abstract"],
            template=classification_prompt_template
        ).format(title=title, year=year, abstract=abstract)

        classification_response = await llm.apredict(classification_prompt)
        sport, technology = extract_info_from_response(classification_response)
        technology = technology.replace("{", "").replace("}", "").strip()

        # PICO step
        pico_prompt = PromptTemplate(
            input_variables=["title", "abstract"],
            template=pico_prompt_template
        ).format(title=title, abstract=abstract)

        pico_response = await llm.apredict(pico_prompt)
        p, i, c, o = extract_pico_from_response(pico_response)

        clean_title = re.sub(r'\s+', ' ', title).strip()

        print(f"Title: {clean_title}\nYear: {year}\nUT: {ut}\nSport: {sport}\nTechnology: {technology}\nP: {p}\nI: {i}\nC: {c}\nO: {o}\n{'='*60}\n")

        results.append({
            "title": clean_title,
            "year": year,
            "ut": ut,
            "sport": sport,
            "technology": technology,
            "p": p,
            "i": i,
            "c": c,
            "o": o
        })

    # Write CSV
    with open(output_csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["title", "year", "ut", "sport", "technology", "p", "i", "c", "o"])
        writer.writeheader()
        writer.writerows(results)

    print(f"\n✅ Total articles processed: {len(results)}")
    return output_csv_path, len(results)
