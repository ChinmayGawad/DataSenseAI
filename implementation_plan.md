# 🗺️ DataSense AI — Implementation Plan

## Goal Description
Build **DataSense AI**, an autonomous data investigation platform. The system uses a dual AI strategy: Google Antigravity to develop, orchestrate, and test the software, and DeepSeek Harness to power the internal multi-agent runtime that analyzes uploaded datasets. The end goal is to automatically ingest unknown datasets, clean them, formulate an investigation plan, run ML analysis, select appropriate charts, and present fact-checked insights in a dynamic dashboard.

> [!IMPORTANT]
> **User Review Required**
> Please review this complete implementation roadmap. Once approved, we will begin executing Phase 1 (Architecture & Setup) using Antigravity agents.

## Implementation Strategy: The Dual AI Approach
- **Internal Product Agent (DeepSeek Harness):** Orchestrates specialized data agents (Detective, Inspector, Cleaner, Planner, Scientist, Architect, Analyst, Fact Checker) via plugins.
- **External Dev Agent (Google Antigravity):** Automates the software engineering process in parallel across frontend, backend, ML tools, QA, and browser verification.

---

## Phase 1: Architecture & Foundation (Day 1)
**Objective:** Set up the project skeleton, database schema, and core API contracts.

### Step 1.1: Project Initialization
Initialize the microservice monorepo structure to isolate the Node.js DeepSeek Harness from the pure Python ML functions.

```text
datasense-ai/
├── frontend/ (Next.js)
├── backend/ (FastAPI API Layer)
├── harness-service/ (Node.js/DeepSeek Harness)
├── core-ml/ (Python Pandas/Scikit-learn tools)
└── tests/
```

### Step 1.2: Supabase Setup
- Configure PostgreSQL database schema for users and dataset metadata.
- Set up Supabase Storage buckets for raw and processed datasets.
- Configure Authentication (if time permits, otherwise mock for MVP).

### Step 1.3: Antigravity Orchestration (Scaffolding)
Run Antigravity to scaffold the base applications:
- **Command:** `npx create-next-app@latest frontend --typescript --tailwind --app`
- **Command:** `pip install fastapi uvicorn pandas scikit-learn` in backend directory.

---

## Phase 2: Parallel Development (Days 2-4)
We will invoke specialized Antigravity subagents to build components simultaneously. These subagents will be instructed to utilize specific Antigravity skills.

### 🤖 Subagent 1: Frontend Engineer
**Focus:** Next.js, Tailwind CSS, shadcn/ui, Plotly.js
**Skill to use:** `frontend-design` and `ui-ux-pro-max`
**Task:** Build the UI components with an anti-slop, modern design.
- Landing page and Dataset Upload page (drag & drop).
- "Agent Timeline" component showing active agent states.
- Dynamic Dashboard component capable of rendering JSON-configured Plotly charts.
- Insights Panel to display text insights.

### 🤖 Subagent 2: Data Science Engineer
**Focus:** Python, Pandas, Scikit-learn
**Task:** Build pure, reusable Python data analysis tools (independent of LLM) inside `core-ml/`.
- `detect_column_types(df)`
- `analyze_missing_values(df)`
- `calculate_correlations(df)`
- `detect_outliers(df)`
- `generate_summary_stats(df)`

### 🤖 Subagent 3: DeepSeek Harness Engineer
**Focus:** Node.js, DeepSeek Harness (`@deepseek/harness`)
**Task:** Configure the DeepSeek Harness runtime and agent definitions inside `harness-service/`.
- Define the 8 agents (Detective, Inspector, Cleaner, Planner, Scientist, Architect, Analyst, Fact Checker).
- Configure the agents to call the `core-ml` Python scripts as external Plugins/Tools.
- Create the strict Fact-Checking loop ensuring LLM explanations match Python facts.

### 🤖 Subagent 4: Backend Engineer
**Focus:** FastAPI, Pydantic
**Skill to use:** `security-review` (for secure file upload and database handling)
**Task:** Build the API layer in `backend/` to connect the Frontend to the Harness microservice.
- `POST /api/upload` - Handle file upload to Supabase securely and trigger pipeline.
- `GET /api/status/{job_id}` - Stream agent status for the timeline UI.
- `GET /api/dashboard/{job_id}` - Return JSON schema for the dynamic dashboard.

---

## Phase 3: Integration & Pipeline Assembly (Day 5)
**Objective:** Connect the DeepSeek Harness output to the FastAPI endpoints and render it in the Next.js frontend.

- **Pipeline Execution:** When a CSV is uploaded, FastAPI passes the file path to DeepSeek Harness.
- **Agent Handoffs:** Ensure smooth state passing between the Investigation Planner -> ML Scientist -> Visualization Architect.
- **Frontend Hydration:** Parse the final JSON result from the backend into Plotly configurations and insight cards.

---

## Phase 4: Testing & QA (Day 6)
**Objective:** Verify system reliability against multiple domain datasets.
**Skill to use:** `code-review-and-quality`

### Automated Tests & Review
Use the `code-review-and-quality` skill to perform a multi-axis code review on the integrated services before final testing.
Run tests against varied datasets to ensure graceful handling of edge cases.
- **Test Dataset A:** Retail Sales (High variance, strong correlations).
- **Test Dataset B:** Marketing Campaign (Many categorical variables, missing data).
- **Test Dataset C:** Healthcare Tabular Data (Strict numeric ranges, complex outliers).

### Manual Verification
- Upload a dirty dataset.
- Observe the Agent Timeline UI updating in real-time.
- Verify the cleaning agent successfully imputed or dropped missing values.
- Check if the generated charts (Plotly) accurately reflect the data.
- Read an insight, then manually calculate the metric to ensure the Fact Checker agent functioned correctly.

---

## Phase 5: Browser Verification, Audit & Polish (Day 7)
**Skill to use:** `production-audit`
- Use the `production-audit` skill to run a local-evidence production readiness check.
- Use Antigravity's browser testing capabilities to navigate the local Next.js app.
- Fix responsive UI issues (mobile view for dashboard).
- Finalize error handling (e.g., unsupported file types, completely empty columns).
- Prepare final presentation demo showcasing the "Investigate This Finding" feature.

## Open Questions
1. Do you have a preferred Supabase project ready to link, or should we use local mock storage for the initial dev phase?
2. DeepSeek Harness is highly experimental; if we run into framework-level blockers, are you comfortable falling back to a LangGraph or custom Python orchestration layer while maintaining the same multi-agent architecture?
