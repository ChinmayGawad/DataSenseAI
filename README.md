# 🧠 DataSense AI — Autonomous Data Investigation Platform

> **"A team of AI agents investigates your data."**

DataSense AI is an autonomous data investigation platform powered by a dual-agent architecture:
1. **Development & Orchestration**: Google Antigravity
2. **Runtime Multi-Agent Investigation**: DeepSeek Harness (`harness-service/`) + Decoupled Pure Python Fact Engine (`core-ml/`)

---

## 🏛️ Monorepo Architecture

```text
DataSenseAI/
├── frontend/             # Next.js 16 (App Router, TypeScript, Tailwind CSS, Plotly.js)
├── backend/              # FastAPI REST API (Job store, pipeline orchestrator, endpoints)
├── harness-service/      # Node.js/TypeScript DeepSeek Harness agent runtime
├── core-ml/              # Pure Python mathematical analysis engine (Zero hallucination)
├── supabase/             # PostgreSQL database schema & storage definitions
├── datasets/             # Multi-domain benchmark datasets (Retail, Marketing, Healthcare)
└── tests/                # Automated end-to-end integration and algorithmic test suites
```

---

## 🤖 The 8 Specialized Investigation Agents

| Agent | Icon | Role | Tooling |
| :--- | :---: | :--- | :--- |
| **Data Detective** | 🔍 | Schema understanding & semantic type detection | `detect_column_types` |
| **Quality Inspector** | 🩺 | Missingness, duplicates & Data Health Score (0-100) | `inspect_data_quality` |
| **Cleaning Agent** | 🧹 | Mathematically justified imputation & deduplication | `clean_dataset` |
| **Investigation Planner** | 🧠 | Autonomous hypothesis & analysis plan generation | `formulate_plan` |
| **Data Scientist** | 🤖 | Outlier detection, KMeans clustering & PCA 2D projection | `scikit-learn`, `scipy` |
| **Visualization Architect** | 📊 | Dynamic Plotly chart selection & "Why chosen" rationale | `chart_generator` |
| **Insight Analyst** | 💡 | Translates statistical facts into plain-language insights | `synthesize_insights` |
| **AI Fact Checker** | ✅ | Validates assertions against Python ground truth | `verify_mathematical_proof` |

---

## 🚀 Quickstart Guide

### 1. Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI available at: `http://localhost:8000/docs`

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Web application available at: `http://localhost:3000`

### 3. Harness Service (Node.js)
```bash
cd harness-service
npm install
npm run build
npm start
```
Runtime microservice running at: `http://localhost:4000`

### 4. Running Integration Tests
```bash
pytest tests/test_pipeline.py -v
```
