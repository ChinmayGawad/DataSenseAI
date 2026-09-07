# DataSense AI — Building PS3 Using **DeepSeek Harness + Google Antigravity Simultaneously**

Yes — this can be a very strong approach.

But I recommend using them for **different responsibilities** instead of trying to force both tools to do exactly the same thing.

## The best architecture is:

> **Google Antigravity → develops, tests, and orchestrates the software engineering work**

> **DeepSeek Harness → powers your application's customizable agentic AI runtime**

This gives you two layers of agentic AI.

![Image](https://images.openai.com/static-rsc-4/ZS8Lv0ElczFjzr4WpBaBiUjWn68L3jJ3bgH_nEMYBB5jUy7tvqPplNV2c296irGTJsz156xd53oXrxcDefdhZ2P1_PpleuCNrJ0trfdXN1VAk6eQA0is892VXRwGQKdo87FSaT-br5LymZ0gOnJDlQVo45Cr58v4bZebAfXzkiKu6CK-6_zhv0REHYYUejBg?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/yw8M8tA_ZhBI899C3gnN6RDZipOUDW_w6HdBQph7bAPXtDDbjdgFpl1QXjERoYi-s08XCGpbaelGMW-MSNeS7aaeuVTW2hRjcFWbdUHSy5x4kdqpMCcnagH8LylvR3QeTZmA8xmuNM7IPuY9k3fWlzU3N_Af_UTqOEq91logZExWOvXMzESjWb2LXftEf9-4?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/vigOC29Dv9-cxmGyNeFzNiY2_02jwNhOu3Fm9UcmMEu6V-Nfkh3V9hZ_1_IZ2ocJQM-Wmt4m-xNKIhPzONjvr7Eye-KKgO-OshjHJVCbgjnGgcXEJgaFCma9TRvNV4W3-GFdKoDYbE7yxTqBzEA2t3ny0gDUPauZfm2h4to20d4sWm8iWQZjeqXcZFmruSkW?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/3-5StipmLBUzlXomKcvW7Okhign3XsRFvEuSx8qcUujEVohmTadS_ILqItps82D4TyOFKyhwqCEireWImVwcjU-Tenyxek5ORg6SaIThLA8ST2VQOm7tKTNieP_RbrRzr4DXOTSst4ktRWxrlyys2ghmR1Y3ZgLxHAUgJDiJaTIjiRtjWwzF8s-vNeg2K9pm?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/MPrPd1oGyK2TRQDlQAuCLoMKGXzWXdOe0y0Oc4PPFE5RmKCkodL3N0gRjf98oWPnoDnI1wi0NKcxLpxiAICma2Qvnwjw1PlHvf-dqe-xZ82VuqykFeGOQHRtJNiSr0ePZFClo3Eb0EMjye2-epFlxj44ffjbnFxpPUKRfM1kFz4BdbFQv7CdWRtCH8MOYCab?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/mxX_Xck4Of7ognIQbZJCs8je2_AE4RDOxoqY3OsvKn13UkzKaU3CRpFQvhXeHYGeqHX_dZPv6e1hKfNhthhDLdg72vtIpjv0QEZQ1JDa60_j8sua0G2az6MTBX8qZieWKs5cZ8sHm0sIfx-vORDc86Jrp5Qh-rQKrKVNfrO-Y962fQSWlLhmHFO9xllXuXfJ?purpose=fullsize)

---

# 1. First, Understand the Two Tools

## 🧠 DeepSeek Harness

[DeepSeek Harness official website](https://www.deepseek.com/harness/en/?utm_source=chatgpt.com)

DeepSeek Harness is an open-source agent harness built around an **everything-is-a-plugin architecture**. Models, tools, skills, sessions, storage, sandboxes, loops, scheduling, and UI capabilities can be composed as plugins. It currently includes modes ranging from a full coding-agent setup to minimal and custom creator modes. ([DeepSeek][1])

For **DataSense AI**, you can use it to build and experiment with your own:

* Agent roles
* Tools
* Skills
* Agent workflows
* Analysis capabilities
* Custom plugins

---

# 🚀 Google Antigravity

[Google Antigravity official platform](https://www.antigravity.google/?utm_source=chatgpt.com)

Google Antigravity is an agent-first development platform that can run agents across development tasks. Its current ecosystem includes Antigravity 2.0, CLI, SDK, and IDE, with parallel agents/subagents and artifact-based verification. ([Google Antigravity][2])

For this project, Antigravity should be your:

* AI development team
* Parallel coding environment
* Testing assistant
* UI development agent
* Backend development agent
* Debugging agent
* Browser testing agent

Antigravity's agents can work across the editor, terminal, and browser and produce plans, code changes, screenshots, and other artifacts for verification. ([Google Antigravity][3])

---

# 🏗️ My Recommended Architecture

```text
                         YOU
                          │
                          ▼
              GOOGLE ANTIGRAVITY 2.0
          ┌────────────────────────────┐
          │                            │
          │  Frontend Development      │
          │  Backend Development       │
          │  ML Development            │
          │  Testing                   │
          │  Debugging                 │
          │  Browser Verification      │
          │                            │
          └──────────────┬─────────────┘
                         │
                         ▼
                 DATASENSE AI APP
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     Frontend         Backend       Agent Runtime
     Next.js          FastAPI       DeepSeek Harness
                                          │
                           ┌──────────────┼──────────────┐
                           ▼              ▼              ▼
                      Data Agent     ML Agent      Insight Agent
                           │              │              │
                           └──────────────┼──────────────┘
                                          ▼
                                   Tool Plugins
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
                  Pandas              Scikit-learn           LLM
```

---

# 2. The Actual Project Scope

Your project will be:

# 🧠 **DataSense AI — Autonomous Data Investigation Platform**

The user uploads an unknown spreadsheet.

Your AI agent system automatically:

```text
UPLOAD DATASET
       ↓
UNDERSTAND DATA
       ↓
CHECK DATA QUALITY
       ↓
CLEAN DATA
       ↓
CREATE ANALYSIS PLAN
       ↓
RUN ML ANALYSIS
       ↓
DISCOVER PATTERNS
       ↓
SELECT BEST CHARTS
       ↓
GENERATE DASHBOARD
       ↓
GENERATE VERIFIED INSIGHTS
```

This directly covers PS3's required automatic data understanding, cleaning, ML analysis, visualization, and plain-language insight generation. 

---

# 3. Your Unique Agentic AI Idea

I recommend calling your main feature:

# 🔎 **Autonomous Investigation Engine**

Instead of saying:

> AI analyses your data.

You say:

> **A team of AI agents investigates your data.**

---

# 4. DeepSeek Harness Agent System

Inside your application, build specialized agents.

## Agent 1 — Data Detective 🔍

### Job

Understand the dataset.

It answers:

```text
What is this dataset?

What type is every column?

Which columns are IDs?

Which columns contain dates?

Which columns are numbers?

Which columns are categories?
```

### Example

```text
Order_ID       → Identifier
Order_Date     → Date
Region         → Categorical
Sales          → Numeric
Profit         → Numeric
```

---

# Agent 2 — Data Quality Inspector 🩺

Checks:

```text
✓ Missing values

✓ Duplicate records

✓ Invalid dates

✓ Wrong numeric formats

✓ Empty columns

✓ Suspicious values
```

Example:

```text
DATA HEALTH SCORE

████████░░ 82%

Issues Found:

23 missing values
5 duplicate rows
8 inconsistent date formats
```

---

# Agent 3 — Data Cleaning Agent 🧹

This agent decides how to fix data.

Example:

```text
Column: Age

Missing Values: 24

Possible strategies:

1. Remove rows
2. Fill with mean
3. Fill with median
```

The agent selects an appropriate strategy and records the reason.

```text
Decision:

Median selected because the Age distribution
contains extreme values.
```

This makes your application genuinely intelligent.

---

# Agent 4 — Investigation Planner 🧠

This is one of your most important agents.

It looks at the metadata and decides:

> What should we investigate?

Example:

```text
Dataset contains:

Date
Region
Product
Sales
Profit
Quantity
```

The Investigation Planner creates:

```text
INVESTIGATION PLAN

1. Analyse sales trends over time

2. Compare regions

3. Compare products

4. Check sales/profit correlation

5. Detect unusual transactions

6. Identify performance clusters
```

---

# Agent 5 — Data Scientist Agent 🤖

This agent executes ML and statistical analysis.

Possible tools:

### Correlation

```text
Pearson
Spearman
```

### Outliers

```text
Isolation Forest
IQR
Z-Score
```

### Clustering

```text
KMeans
DBSCAN
```

### Dimensionality Reduction

```text
PCA
```

---

# Agent 6 — Visualization Architect 📊

Its job:

> Decide how the results should be displayed.

Example:

```text
Date + Numeric
      ↓
Line Chart
```

```text
Category + Numeric
      ↓
Bar Chart
```

```text
Numeric + Numeric
      ↓
Scatter Plot
```

```text
Multiple Numeric Variables
      ↓
Correlation Heatmap
```

This is important because PS3 specifically says the system should automatically generate a dashboard suited to the data without the user manually choosing chart types. 

---

# Agent 7 — Insight Analyst 💡

This agent converts data into human language.

### Technical result

```text
Correlation = 0.84
```

### Human explanation

> Advertising expenditure and sales have a strong positive relationship in this dataset.

---

# Agent 8 — AI Fact Checker ✅

This is your unique feature.

Every insight goes through a verification process.

```text
INSIGHT AGENT
      │
      ▼

"Sales increased significantly"

      │
      ▼

FACT CHECK AGENT

Actual increase = 1.2%

      │
      ▼

❌ REJECTED

      │
      ▼

"Sales increased slightly by 1.2%"
```

This gives you a powerful presentation point:

> **"Our AI doesn't just generate insights. Another agent verifies them against the actual dataset."**

---

# 5. DeepSeek Harness Architecture Inside Your App

I would structure the DeepSeek Harness side conceptually like this:

```text
DEEPSEEK HARNESS
│
├── Model Plugin
│
├── Agent Plugins
│   ├── Data Detective
│   ├── Cleaner
│   ├── Planner
│   ├── Data Scientist
│   ├── Visualization Agent
│   ├── Insight Agent
│   └── Fact Checker
│
├── Tool Plugins
│   ├── CSV Tool
│   ├── Excel Tool
│   ├── Pandas Tool
│   ├── Statistics Tool
│   ├── ML Tool
│   └── Chart Tool
│
├── Session Plugin
│
└── Storage Plugin
```

DeepSeek Harness is particularly suitable for experimenting with this modular design because its official architecture treats agent capabilities as composable plugins. ([DeepSeek][1])

---

# 6. How Antigravity Works Simultaneously

This is the workflow I recommend.

Instead of one AI agent writing the whole project, create multiple development tasks.

---

## 🤖 Antigravity Agent 1

# Frontend Engineer

Prompt:

```text
Build the Next.js frontend for DataSense AI.

Create:

- Landing page
- Dataset upload page
- AI investigation screen
- Dynamic dashboard
- Insights page

Use:

Next.js
TypeScript
Tailwind CSS
shadcn/ui
Plotly
```

---

## 🤖 Antigravity Agent 2

# Backend Engineer

Prompt:

```text
Build the FastAPI backend.

Create:

- Dataset upload API
- Dataset metadata API
- Analysis execution API
- Insights API
- Dashboard configuration API
```

---

## 🤖 Antigravity Agent 3

# Data Science Engineer

Prompt:

```text
Build reusable Python analysis tools.

Implement:

- Column type detection
- Missing value analysis
- Duplicate detection
- Correlation analysis
- Outlier detection
- Clustering
- Automatic statistics
```

---

## 🤖 Antigravity Agent 4

# DeepSeek Harness Engineer

Prompt:

```text
Design the agent workflow using DeepSeek Harness.

Create:

- Data understanding agent
- Cleaning agent
- Investigation planner
- ML analysis agent
- Visualization agent
- Insight agent
- Fact-checking agent

All agents must use structured inputs and outputs.
```

---

## 🤖 Antigravity Agent 5

# QA Engineer

Prompt:

```text
Test the system using different datasets:

1. Sales dataset
2. Marketing dataset
3. Healthcare dataset

Verify that:

- Column detection works
- Cleaning works
- Dashboard changes dynamically
- Insights match the data
```

Antigravity supports parallel and asynchronous agents/workspaces, which is useful for dividing the project into these independent engineering tasks. ([Google Antigravity][3])

---

# 7. Complete Tech Stack

## 🎨 Frontend

| Technology    | Purpose                      |
| ------------- | ---------------------------- |
| Next.js       | Web framework                |
| TypeScript    | Type safety                  |
| Tailwind CSS  | Styling                      |
| shadcn/ui     | UI components                |
| Plotly.js     | Interactive analytics charts |
| Framer Motion | Animations                   |

---

# ⚙️ Backend

| Technology   | Purpose               |
| ------------ | --------------------- |
| Python 3.11+ | Main backend language |
| FastAPI      | REST API              |
| Pydantic     | Data validation       |
| Uvicorn      | API server            |

---

# 🤖 Agentic AI Runtime

## Primary

[DeepSeek Harness GitHub repository](https://github.com/deepseek-ai/DeepSeek-Harness?utm_source=chatgpt.com)

Use it for:

* Custom agent runtime experiments
* Plugins
* Agent tools
* Agent sessions
* Multi-step execution

**Important:** DeepSeek Harness is currently in developer preview and its official repository warns about compatibility-breaking changes, so pin versions and keep the harness layer isolated behind your own interfaces. ([GitHub][4])

---

# 🧠 Development Agent Platform

## Google Antigravity

Use it for:

* Parallel coding
* Architecture planning
* UI generation
* Testing
* Debugging
* Browser testing
* Documentation

[Google Antigravity documentation](https://www.antigravity.google/docs/home?utm_source=chatgpt.com)

---

# 📊 Data Processing

```text
Pandas
NumPy
OpenPyXL
PyArrow
```

---

# 🤖 Machine Learning

```text
Scikit-learn
SciPy
```

Algorithms:

```text
KMeans

DBSCAN

Isolation Forest

PCA

StandardScaler

SimpleImputer
```

---

# 📈 Visualization

## Frontend

```text
Plotly.js
```

Optional:

```text
Recharts
```

My recommendation:

> Use **Plotly.js** for the main analytics dashboard.

---

# 🗄 Database

For the hackathon:

## Supabase

Use:

```text
PostgreSQL

Authentication

File Storage
```

---

# 8. Recommended Project Structure

```text
datasense-ai/

├── frontend/
│
│   ├── app/
│   │   ├── page.tsx
│   │   ├── upload/
│   │   ├── investigation/
│   │   ├── dashboard/
│   │   └── reports/
│   │
│   ├── components/
│   │   ├── upload/
│   │   ├── investigation/
│   │   ├── charts/
│   │   └── dashboard/
│   │
│   └── lib/
│
├── backend/
│
│   ├── main.py
│   │
│   ├── api/
│   │   ├── upload.py
│   │   ├── analysis.py
│   │   ├── insights.py
│   │   └── dashboard.py
│   │
│   ├── agents/
│   │   ├── data_detective/
│   │   ├── cleaning/
│   │   ├── planner/
│   │   ├── scientist/
│   │   ├── visualization/
│   │   ├── insights/
│   │   └── validator/
│   │
│   ├── tools/
│   │   ├── dataframe_tools.py
│   │   ├── cleaning_tools.py
│   │   ├── statistics_tools.py
│   │   ├── ml_tools.py
│   │   └── chart_tools.py
│   │
│   └── services/
│
├── harness/
│
│   ├── plugins/
│   │   ├── dataset_tools/
│   │   ├── ml_tools/
│   │   └── insight_tools/
│   │
│   ├── agent_configs/
│   └── workflows/
│
├── tests/
│
└── docs/
```

---

# 9. The Most Important Technical Design Decision

## Separate AI reasoning from actual calculations.

This is critical.

### ❌ Don't do this

```text
LLM
 │
 ▼
"Sales increased by 35%"
```

The LLM might hallucinate.

---

### ✅ Do this

```text
PYTHON
 │
 ▼
Calculate:

Previous Sales = 100,000
Current Sales = 135,000

Actual Increase = 35%

        │
        ▼

AGENT / LLM
        │
        ▼

Explain:

"Sales increased by 35%"
```

So:

# Python/ML = Facts

# Agents/LLM = Decisions and explanations

---

# 10. The Complete System Workflow

```text
USER
 │
 │ Upload CSV / Excel
 ▼
┌─────────────────────────┐
│   NEXT.JS FRONTEND      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      FASTAPI API        │
└────────────┬────────────┘
             │
             ▼
══════════════════════════════
     DEEPSEEK HARNESS
══════════════════════════════
             │
             ▼
      DATA DETECTIVE
             │
             ▼
    QUALITY INSPECTOR
             │
             ▼
       CLEANING AGENT
             │
             ▼
   INVESTIGATION PLANNER
             │
             ▼
      ML SCIENTIST
             │
             ▼
 VISUALIZATION ARCHITECT
             │
             ▼
      INSIGHT ANALYST
             │
             ▼
       FACT CHECKER
══════════════════════════════
             │
             ▼
      JSON RESULTS
             │
             ▼
┌─────────────────────────┐
│  DYNAMIC AI DASHBOARD   │
└─────────────────────────┘
```

---

# 11. What Makes Your Project Unique?

Your project should not simply say:

> "Upload data and see charts."

Your pitch should be:

# 🔥 **AI doesn't just visualize your data. It investigates it.**

Your unique features:

### 🔎 Autonomous Investigation Plan

AI first decides what to investigate.

### 🤖 Multi-Agent Investigation

Different agents perform specialized tasks.

### 📊 Self-Designing Dashboard

Dashboard changes based on the dataset.

### 💡 AI Discovers Questions

The AI finds things the user didn't ask about.

### 🕵️ Deep Investigation

Users click:

> Investigate this finding

and agents perform deeper analysis.

### ✅ Fact-Checked Insights

Another agent verifies the generated insights.

---

# 12. What You Need Before Starting

## Software

* Node.js
* Python 3.11+
* Git
* VS Code
* Docker (recommended)
* Google Antigravity
* DeepSeek Harness

DeepSeek Harness's official quick-start currently uses Node.js and can be launched through its `dsh` package, while its project remains under active developer-preview development. ([DeepSeek][1])

---

## API/Services

Potentially:

* LLM API access
* Supabase project
* GitHub repository

---

## Practice Datasets

You should collect at least:

### Dataset 1

Retail sales

### Dataset 2

Marketing campaign

### Dataset 3

Customer behaviour

### Dataset 4

Healthcare-style tabular data

The PS3 judging requirement specifically makes testing on multiple domains important because the final dataset may be unseen and different in content/domain. 

---

# 13. Best Development Strategy Using Both Simultaneously

I recommend this workflow:

## Phase 1 — Architecture

**Antigravity Agent**

Creates:

* Architecture
* API design
* Folder structure
* Database design

You review and approve.

---

## Phase 2 — Parallel Development

Run separate agents:

```text
AGENT 1
Frontend

AGENT 2
FastAPI

AGENT 3
ML tools

AGENT 4
DeepSeek Harness workflow
```

They work simultaneously.

---

## Phase 3 — Integration

Assign Antigravity:

> Integrate the frontend, backend, and DeepSeek Harness runtime. Run the application and fix all integration errors.

---

## Phase 4 — Testing

Assign:

```text
Test Dataset A
Test Dataset B
Test Dataset C
```

Verify that the dashboard changes.

---

## Phase 5 — Browser Verification

Use Antigravity's browser-oriented capabilities to:

* Upload files
* Run analysis
* Test charts
* Check responsive UI
* Verify errors

Antigravity is explicitly designed around agents that can operate across development surfaces including the editor, terminal, and browser, with artifacts used for verification. ([Google Antigravity][3])

---

# 🏆 My Recommended Final Scope

For the competition, I would build these as **MVP mandatory features**:

## Must Have

✅ CSV and Excel upload
✅ Automatic column detection
✅ Missing value handling
✅ Duplicate handling
✅ Automatic formatting correction
✅ Descriptive statistics
✅ Correlation analysis
✅ Outlier detection
✅ Automatic chart selection
✅ Dynamic dashboard
✅ Plain-language AI insights
✅ Agent activity timeline

## Strong Differentiators

🔥 Investigation Planner Agent
🔥 Multi-agent workflow
🔥 "Why did AI choose this chart?"
🔥 Fact-checked insights
🔥 "Investigate This Finding" button
🔥 Dataset Health Score

## Only If Time Remains

⚡ Clustering
⚡ Chat with dataset
⚡ PDF reports
⚡ User accounts
⚡ Saved dashboards

---

# My Final Recommendation

For **your exact setup**, I would build:

> **DataSense AI using DeepSeek Harness as the experimental/customizable agent harness inside the application, while using Google Antigravity as the parallel AI engineering environment to build, test, debug, and verify the full-stack product.**

This gives you a very strong story for judges:

> **"We used agentic AI not only inside the product, where specialized agents investigate datasets, but also during development, where parallel software-engineering agents accelerated the construction and testing of the system."**

One practical caution: because DeepSeek Harness is still in developer preview and evolving, keep your core data-processing tools independent of the harness. Your **Pandas/Scikit-learn functions should work even if you later replace the agent harness**. ([GitHub][4])

If you want, the next best step is for me to give you a **complete step-by-step implementation roadmap starting from Day 1**, including exactly **which Antigravity agent to launch, the prompt to give each agent, the DeepSeek Harness setup, and the exact first version of the project to build**.

[1]: https://www.deepseek.com/harness/en/?utm_source=chatgpt.com "DeepSeek Harness developer preview: Everything is a plugin"
[2]: https://www.antigravity.google/?utm_source=chatgpt.com "Google Antigravity"
[3]: https://www.antigravity.google/docs/ide/overview/?utm_source=chatgpt.com "Overview | Google Antigravity Docs"
[4]: https://github.com/deepseek-ai/DeepSeek-Harness?utm_source=chatgpt.com "GitHub - deepseek-ai/deepseek-harness: DeepSeek Harness: Everything is a Plugin. · GitHub"
