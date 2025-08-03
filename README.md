# Setup guide

## 1 Setup Backend

### 1.1 Navigate to backend folder and create virtual environment:

```bash
cd backend
python -m venv venv
```

### 1.2 Activate the environment:

- On Windows:
```bash
venv\Scripts\activate
```

- On Mac/Linux:
```bash
source venv/bin/activate
```

### 1.3 Install dependencies:
```bash
pip install -r requirements.txt
```


## 2 Setup Frontend

### 2.1 Install Node.js (if not already installed):
Download from: https://nodejs.org/en/download

### 2.2 Install frontend dependencies:
```bash
cd frontend/sports-reviewer
npm install
```


## 3 Setup Database

### 3.1 Install MySQL (if not already installed):
Download from: https://dev.mysql.com/downloads/
Install MySQL Server and optionally MySQL Workbench.

### 3.2 Create database:
- Open MySQL Workbench.
- Run the SQL script createDb.sql found in the project root.


## 4 Setup Local LLM with Ollama

### 4.1 Install Ollama:
Download from: https://ollama.com/download

### 4.2 Download the model:
```bash
ollama pull gemma3
```


## 5 Run the Application

### 5.1 Activate your Python environment (if not already active):
```bash
venv\Scripts\activate
```

### 5.2 Start the FastAPI backend:
```bash
cd backend
python main.py
```

### 5.3 Start the frontend dev server:
```bash
cd frontend/sports-reviewer
npm run dev
```
