import csv, json, re
from pathlib import Path
from typing import List, Tuple
from choices import SPORT_CHOICES, TECH_CHOICES, POP_CHOICES, OUT_CHOICES

from langchain.llms import Ollama
from langchain.prompts import PromptTemplate


# ───────────── Simple WoS parser ──────────────
def parse_articles(raw: str) -> List[Tuple[str, str, str, str]]:
    """Return (title, abstract, year, ut) for every WoS record in the text."""
    recs = []
    for part in raw.strip().split("ER\n\n"):
        if not part.strip():
            continue
        if not re.search(r"^TI ", part, re.M):
            continue

        def first(pat):
            m = re.search(pat, part, re.S | re.M)
            return m.group(1).strip() if m else ""

        recs.append(
            (
                first(r"^TI (.+?)(?=\n[A-Z]{2} |\n$)") or "No title",
                first(r"^AB (.+?)(?=\n[A-Z]{2} |\n$)") or "No abstract",
                first(r"^PY (\d{4})") or "Unknown",
                first(r"^UT (.+)") or "Unknown",
            )
        )
    return recs


# ───────────── LLM helpers ──────────────
CLASS_PROMPT = """
Return **JSON only** with the keys **"sport"** and **"technology"**.

You will be given an article title, publication year, and abstracts. 
Your task is to identify the sport and technology the provided article is **primarily about**.

• **sport** → Only classify an article if the sport is the main focus of the study. 
Do not classify based on incidental mentions or comparisons.
If none clearly apply, return the string "None".  

• **technology** → choose **zero or more** items from **TECH_CHOICES**  
― comma-separated, **only include a term if it is explicitly found** in
either the article title or abstract (case-insensitive).  
If no technology term is present, return "None" if no suitable term exists,
do not add your own technology terms.

TECH_CHOICES  = {tech_list}

### ARTICLE ###
Title: {title}
Year:  {year}
Abstract: {abstract}
"""

PICO_PROMPT = """
Return **JSON only** with the keys **"population"** and **"outcome"**.

• **population** → choose the single best match from **POP_CHOICES**.  
If no listed population fits, return "None" if no suitable term exists,
do not add your own population term.

• **outcome** → list **one or more** comma-separated items drawn **only** from
**OUT_CHOICES** that clearly appear in the abstract or title.  
If no listed outcome fits, return "None" if no suitable term exists,
do not add your own outcome terms.

POP_CHOICES = {pop_list}
OUT_CHOICES = {out_list}

### ARTICLE ###
Title: {title}
Abstract: {abstract}
"""




def first_json(text: str):
    """
    Extracts and returns the first valid JSON object from a text blob.
    Returns {} if no JSON object is found or parsing fails.
    """
    try:
        # Find the first JSON-like block
        match = re.search(r"\{[\s\S]*?\}", text)
        return json.loads(match.group(0)) if match else {}
    except Exception as e:
        print("JSON parsing error:", e)
        print("Raw output was:", text)
        return {}

def clean_ut(ut_raw: str) -> str:
    m = re.search(r"WOS:\d+", ut_raw)
    if m:
        return m.group(0)[:19]  # ensure max 19 characters
    return "Unknown"

# ───────────── Pipeline ──────────────
async def process_articles(txt_path: str, out_csv: str):
    text = Path(txt_path).read_text(encoding="utf‑8")
    records = parse_articles(text)

    records = [
        (title, abstract, year, clean_ut(ut))
        for title, abstract, year, ut in records
    ]

    llm = Ollama(model="gemma3:27b")
    rows = []

    for title, abstract, year, ut in records:
        # 1) sport / tech --------------------------------------------------
        prompt1 = PromptTemplate(
            template=CLASS_PROMPT,
            input_variables=["title", "year", "abstract", "sport_list", "tech_list"],
        ).format(
            title=title,
            year=year,
            abstract=abstract,
            sport_list=SPORT_CHOICES,
            tech_list=TECH_CHOICES,
        )

        info1 = first_json(await llm.ainvoke(prompt1))

        sport = info1.get("sport", "None")

        if sport not in SPORT_CHOICES and sport != "None":
            sport = "None"

        raw_tech = info1.get("technology") or []
        if isinstance(raw_tech, str):
            raw_tech = [t.strip() for t in raw_tech.split(",") if t.strip()]
        elif not isinstance(raw_tech, list):
            raw_tech = []

        full_text = (title + " " + abstract).lower()
        present_techs = [t for t in raw_tech if t.lower() in full_text]
        if not present_techs:
            present_techs = ["None"]

        # 2) population / outcome -----------------------------------------
        prompt2 = PromptTemplate(
            template=PICO_PROMPT,
            input_variables=["title", "abstract", "pop_list", "out_list"],
        ).format(
            title=title,
            abstract=abstract,
            pop_list=POP_CHOICES,
            out_list=OUT_CHOICES,
        )

        info2 = first_json(await llm.ainvoke(prompt2))
        
        clean_title = re.sub(r'\s+', ' ', title)
        print(
            f"Title: {clean_title}\n"
            f"Year: {year}\n"
            f"UT: {ut}\n"
            f"Sport: {sport}\n" 
            f"Population: {info2.get('population', 'None')}\n"
            f"Technology: {present_techs}\n"
            f"Outcome: {info2.get('outcome', 'None')}\n"
            + "="*50 + "\n"
        )

        rows.append(
            {
                "ut": ut,
                "title": re.sub(r"\s+", " ", title),
                "year": year,
                "sport": sport, 
                "population": info2.get("population", "None"),
                "technology": present_techs,
                "outcome": info2.get("outcome", "None"),
            }
        )

    # write CSV -----------------------------------------------------------
    with open(out_csv, "w", newline="", encoding="utf‑8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "ut",
                "title",
                "year",
                "sport",
                "population",
                "technology",
                "outcome",
            ],
        )
        writer.writeheader()
        for r in rows:
            r_cp = r.copy()
            r_cp["technology"] = json.dumps(r_cp["technology"], ensure_ascii=False)
            writer.writerow(r_cp)

    print(f"✅ {len(rows)} articles saved → {out_csv}")
    return out_csv, len(rows)
