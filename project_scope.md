# 🧠 DataSense AI — Autonomous Data Investigation Platform

## 🎯 Executive Summary
DataSense AI is an autonomous data investigation platform that leverages a multi-agent system to understand, clean, analyze, and visualize uploaded datasets. Instead of requiring users to manually select charts or analysis methods, a team of specialized AI agents investigates the data and generates a self-designing dashboard with fact-checked, plain-language insights.

## 🚀 Core Workflow
1. **Upload Dataset:** User uploads an unknown spreadsheet (CSV/Excel).
2. **Understand Data:** AI detects column types, identifiers, and categories.
3. **Check Data Quality:** AI inspects for missing values, duplicates, and formats.
4. **Clean Data:** AI autonomously decides and applies cleaning strategies.
5. **Create Analysis Plan:** AI formulates what aspects of the data to investigate.
6. **Run ML Analysis:** AI performs statistical and ML operations (clustering, correlation, etc.).
7. **Discover Patterns:** AI identifies significant trends and anomalies.
8. **Select Best Charts:** AI maps data relationships to optimal visualizations.
9. **Generate Dashboard:** A dynamic dashboard is constructed based on the dataset.
10. **Generate Verified Insights:** AI writes plain-language insights, which are fact-checked by another agent.

## 🏆 Feature Prioritization (MVP Scope)

### ✅ Must Have (Core MVP)
- CSV and Excel file upload functionality.
- Automatic column type detection (dates, numbers, categories, IDs).
- Missing value and duplicate handling with logged decisions.
- Automatic formatting correction.
- Descriptive statistics and correlation analysis.
- Outlier detection.
- Automatic chart selection (Line, Bar, Scatter, Heatmap).
- Dynamic dashboard that adapts to the uploaded data.
- Plain-language AI insights.
- Agent activity timeline to show users what the AI is doing.

### 🔥 Strong Differentiators (Key Selling Points)
- **Investigation Planner Agent:** AI decides *what* to investigate before running analysis.
- **Multi-Agent Workflow:** Distinct specialized agents (Detective, Inspector, Cleaner, Planner, Scientist, Architect, Analyst, Fact Checker).
- **"Why did AI choose this chart?"** feature for transparency.
- **Fact-Checked Insights:** A secondary verification agent ensures LLM claims match calculated Python facts.
- **"Investigate This Finding"** button for deep dives into specific anomalies.
- **Dataset Health Score:** A visual metric showing data quality.

### ⚡ Future Enhancements (If Time Remains)
- Advanced Clustering (KMeans, DBSCAN).
- Chat interface to query the dataset.
- PDF report generation.
- User accounts and authentication.
- Saved dashboards and history.

## 🌟 Unique Value Proposition
**"AI doesn't just visualize your data. It investigates it."** 
By utilizing DeepSeek Harness to orchestrate specialized agents and separating fact-generation (Python/ML) from decision-making/explanation (LLM), DataSense AI provides reliable, hallucination-free, and deep investigative capabilities over raw data.
