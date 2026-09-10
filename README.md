# 🧠 DataSense AI — Autonomous Data Investigation Platform

> **"A team of AI agents investigates your data."**

DataSense AI is an autonomous data investigation platform powered by a dual-agent architecture:
1. **Development & Orchestration**: Google Antigravity
2. **Runtime Multi-Agent Investigation**: Pure Python DeepSeek Harness engine (`harness/`) + Decoupled Fact Engine (`core-ml/`)

---

## 🏛️ Monorepo Architecture

```text
DataSenseAI/
├── frontend/             # Next.js 16 (App Router, TypeScript, Tailwind CSS, Plotly.js, SSE Streaming)
├── backend/              # FastAPI REST & SSE API (Job store, pipeline orchestrator, streaming telemetry)
├── harness/              # Native Python 8-agent investigation runtime (Zero IPC latency, deterministic facts)
├── core-ml/              # Pure Python mathematical analysis & Why? root-cause engine (0% hallucination)
├── harness-service/      # (Optional) Node.js/TypeScript agent metadata service stub
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

## 🚀 Key Platform Capabilities

- **Real-Time Agent Telemetry**: Server-Sent Events (SSE) stream agent steps with sub-100ms latency to the UI timeline.
- **Transparent Operational State**: Instant **Live Backend** vs. **Demo Simulation** status indicator in the top header.
- **Why? Root-Cause Engine**: Causal trees, contribution analysis, and counterfactual simulations.
- **100% Fact-Checked**: Every AI insight is strictly audited against Python mathematical ground truth (0% hallucination).

---

## 💻 Quickstart Guide

### 1. Backend (FastAPI + Python Harness)
```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Swagger UI: `http://localhost:8000/docs`
- Health Probe: `http://localhost:8000/health`

### 2. Frontend (Next.js 16)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

### 3. Running Automated Tests & Benchmarks
```bash
# Run complete 55+ test suite
python -m pytest tests/ -v

# Run Autonomous Multi-Agent Dev-Harness Benchmarks & Scorecard
python -X utf8 dev-harness/cli.py --all
```
