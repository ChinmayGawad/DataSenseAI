# 🎯 DataSense AI — Demo Walkthrough & Hackathon Presentation Guide

> **"AI doesn't just visualize your data. It investigates it."**

---

## 🌟 1. Executive Summary & Dual-AI Architecture

DataSense AI is an **autonomous data investigation platform** built for decision-makers who need instant, deep, and mathematically trustworthy insights from unknown spreadsheets.

### 🧠 The Dual-AI Architectural Advantage:
1. **Google Antigravity 2.0 (External Dev Orchestrator):** Developed the full-stack architecture, engineered the Next.js UI, constructed the FastAPI layer, and automated testing across browser and terminal.
2. **DeepSeek Harness (Internal Agentic AI Runtime):** Powers the internal autonomous investigation engine using an 8-agent collaborative pipeline.
3. **Separation of Facts from Reasoning:** Pure Python (`pandas`, `scikit-learn`, `scipy`) calculates all mathematical facts, while LLM agents formulate hypotheses, explain patterns, and cross-audit numbers to guarantee **0% hallucination**.

---

## 👥 2. The 8 Specialized Agents in Action

```text
[ Raw Spreadsheet Upload ]
         │
         ▼
1. 🔍 Data Detective        ──► Incurs schema, identifies metrics, dimensions & IDs
2. 🩺 Quality Inspector     ──► Audits hygiene, calculates Dataset Health Score (0-100%)
3. 🧹 Data Cleaner          ──► Applies median/mean/mode imputation with logged rationale
4. 🧠 Investigation Planner ──► Formulates prioritized analytical hypotheses
5. 🤖 Data Scientist        ──► Executes Pearson/Spearman, Isolation Forest & KMeans
6. 📊 Visual Architect      ──► Selects optimal Plotly charts + "Why Chosen" rationale
7. 💡 Insight Analyst       ──► Drafts plain-language executive business narratives
8. ✅ AI Fact Checker       ──► Cross-verifies claims against Python calculations
```

---

## 🎬 3. Step-by-Step Live Demo Script

### 📍 Step 1: Upload an Unknown Dataset
- **Action:** Drag and drop `tests/sample_retail_sales.csv` (or click one of the quick benchmark sample chips: *Retail Sales, Marketing Campaign, Healthcare Records*).
- **What happens:** Instant validation (< 20ms), initial schema parsing, and registration.

### 📍 Step 2: The Live Agent Activity Timeline
- **Action:** Click **"Start Autonomous Investigation"**.
- **What to show the judges:**
  - Watch the live **Agent Activity Timeline** animate in real-time as each agent takes turns.
  - Notice the progress bar moving from Data Detective (18%) to Quality Inspector (32%) to Data Cleaner (46%) to Data Scientist (72%) to Fact Checker (98%).

### 📍 Step 3: Column Catalog & Data Health Score
- **Action:** Navigate to **"Data Profile"** in the sidebar.
- **What to show the judges:**
  - The **Dataset Health Score** (e.g. `92.9% - Grade A`).
  - Search and filter columns by type (`Numeric`, `Categorical`, `Date`).
  - Notice how IDs, measures, dimensions, and time indexes are automatically tagged.

### 📍 Step 4: Autonomous Cleaning Report & Audit Trail
- **Action:** Navigate to **"Data Cleaning"**.
- **What to show the judges:**
  - The Before vs. After **Quality Improvement Comparison Gauge** (e.g. `72% ➔ 98%`).
  - Summary cards showing exact counts of:
    - *Missing cells imputed*
    - *Duplicate rows removed*
    - *Format issues resolved*
    - *Inconsistent categories standardized*
  - The transparent **Mathematical Rationale** explaining *why* median was chosen over mean (e.g., *"Distribution is right-skewed; median preserves central tendency without outlier distortion"*).

### 📍 Step 5: Dynamic Dashboard & "Why Did AI Choose This Chart?"
- **Action:** Navigate to **"Dashboard"**.
- **What to show the judges:**
  - Interactive Plotly.js charts (Temporal trends, categorical bar breakdowns, scatter correlations, multi-variable heatmaps, unsupervised KMeans cluster distributions).
  - Hover over the **"Why did AI choose this chart?"** badge on any chart:
    - AI explains its visualization design theory (e.g., *"Categorical dimension (Region) mapped against continuous measure (Sales) is best represented via a bar chart"*).

### 📍 Step 6: Fact-Checked Insights & "Investigate This Finding" 🔥
- **Action:** Navigate to **"Insights"**.
- **What to show the judges:**
  - Every insight card carries a green **"Fact-Checked: 100% Verified"** badge.
  - Click on the **"Investigate Finding"** button on an anomaly or correlation insight:
    - A modal opens executing the **Deep Dive Root-Cause Engine**.
    - Displays exact feature z-scores, cohort variance breakdowns, and a dedicated drilldown subchart!

### 📍 Step 7: Natural Language "Ask Dataset" Querying
- **Action:** Ask questions in the query bar or via API:
  - *"Which Region generated the highest total Sales?"*
  - **Output:** `Based on the data, North leads with total Sales of ₹14,010.50 (Fact-Checked: Verified).`

### 📍 Step 8: Exporting Cleaned Data & Audit Log
- **Action:** Navigate to **"Export"**.
- **What to show the judges:**
  - Instant download of the cleaned dataset in **CSV**, **Excel (.xlsx)**, **JSON**, or **Parquet**.
  - Download of the Markdown **Cleaning Audit Trail**.

---

## 🏆 4. Competitive Differentiation Summary

| Feature | Traditional BI (Tableau / PowerBI) | Generic Chatbots (ChatGPT / Copilot) | DataSense AI |
| :--- | :---: | :---: | :---: |
| **Effort to Dashboard** | Manual drag-and-drop (Hours) | Wall of text / Python code | **Autonomous (Seconds)** |
| **Mathematical Accuracy** | Exact calculations | Prone to hallucinations | **100% Fact-Checked by Python** |
| **Transparency** | None | Black box | **"Why Chosen" Rationales** |
| **Root-Cause Drilldown** | Manual slicing | Theoretical explanation | **One-Click "Investigate Finding"** |
| **Data Hygiene** | Requires manual ETL | Requires pre-cleaned data | **Autonomous Cleaning & Audit** |
