import csv, json, re
from pathlib import Path
from typing import List, Tuple

from langchain.llms import Ollama
from langchain.prompts import PromptTemplate


# ───────────── Canonical choice lists ──────────────
SPORT_CHOICES: List[str] = [
    "American Football", "Football", "Soccer", "Volleyball", "Beach Volleyball", "Tennis",
    "Paddle‑Tennis", "Table Tennis", "Basketball", "Rugby", "Badminton", "Athletics",
    "Baseball", "Softball", "Cricket", "Golf", "Hockey", "Ice Hockey",
    "Field Hockey", "Handball", "Swimming", "Cycling", "Skiing",
    "Snowboarding", "Rowing", "Wrestling", "Martial Arts", "Boxing", "MMA", "Kick Boxing",
    "Muay Thai", "Fencing", "Track and Field", "Triathlon", "Surfing", "Skateboarding",
    "Ultimate Frisbee", "Lacrosse", "Pickleball", "Netball", "Squash",
    "Floorball", "Curling", "Gaelic Football", "Hurling", "Kabaddi",
    "Archery", "Equestrian", "Shooting", "Canoeing/Kayaking", "Climbing"
]

TECH_CHOICES: List[str] = [
    "Wearables", "GPS", "IMU", "Accelerometer", "Heart-Rate Monitor", "HRV",
    "Force Plates", "EMG", "Motion Capture", "Computer Vision", "Machine Learning",
    "Deep Learning", "Artificial Intelligence", "Video Analysis", "Biomechanical Modelling",
    "Virtual Reality", "Augmented Reality", "ECG", "EEG", "Thermal Imaging", "Simulation",
    "3D Printing", "Smart Textiles", "Pressure Insoles", "Pedometer", "Eye Tracking", "Drones"
]

POP_CHOICES: List[str] = [
    "Youth", "Adolescents", "Collegiate", "Elite", "Adults", "Players", "School", "Professional",
    "Sub-Elite", "Amateur", "Recreational", "Masters", "Female", "Male", "Para-Athletes", "Coaches", "Students",

]

OUT_CHOICES: List[str] = [
    "Performance", "Biomechanics", "Physiology", "Injury Incidence",
    "Injury Risk", "Injury Severity", "Injury Prevention", "Recovery",
    "Tactical Behaviour", "Psychology", "Perception",
    "Decision-Making", "Workload", "Fatigue", "Running Economy",
    "Endurance", "Speed", "Strength", "Power", "Accuracy", "Endurance", "Motivation", 
    "Autonomic Function", "Leadership", "Fitness", "Strategy", "Competition",
    "Teaching Ability", "Knowledge Level",
    "Precision", "Skill", "Tactics", "Concussion"
]


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

• **sport** → choose **exactly one** item from **SPORT_CHOICES** below.  
Only select a sport if it is clearly and explicitly mentioned or strongly implied in the title or abstract.  
If none clearly apply, return the string "None".  
Do not guess, do not pick a sport just because it is common or related.

• **technology** → choose **zero or more** items from **TECH_CHOICES**  
― comma-separated, **only include a term if it is explicitly found** in
either the article title or abstract (case-insensitive).  
If no technology term is present, you may add your own relevant technology term(s),  
or return "None" if no suitable term exists.

SPORT_CHOICES = {sport_list}
TECH_CHOICES  = {tech_list}

### ARTICLE ###
Title: {title}
Year:  {year}
Abstract: {abstract}
"""

PICO_PROMPT = """
Return **JSON only** with the keys **"population"** and **"outcome"**.

• **population** → choose the single best match from **POP_CHOICES**.  
If no listed population fits, you may add your own relevant population term(s),  
or return "None" if no suitable term exists.

• **outcome** → list **one or more** comma-separated items drawn **only** from
**OUT_CHOICES** that clearly appear in the abstract or title.  
If no listed outcome fits, you may add your own relevant outcome term(s),  
or return "None" if no suitable term exists.

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
    return m.group(0) if m else "Unknown"

# ───────────── Pipeline ──────────────
async def process_articles(txt_path: str, out_csv: str):
    text = Path(txt_path).read_text(encoding="utf‑8")
    records = parse_articles(text)

    records = [
        (title, abstract, year, clean_ut(ut))
        for title, abstract, year, ut in records
    ]

    llm = Ollama(model="gemma3")
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
