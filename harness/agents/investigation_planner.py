"""
Agent 4 — Investigation Planner 🧠
Job: Look at metadata and formulate an autonomous multi-step investigation plan.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_investigation_planner(
    dataset_name: str,
    columns_profile: Dict[str, Any],
    quality_summary: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes Agent 4 (Investigation Planner) to generate prioritized hypotheses.
    """
    num_cols = columns_profile.get("numeric_columns", [])
    cat_cols = columns_profile.get("categorical_columns", [])
    date_cols = columns_profile.get("datetime_columns", [])
    
    prompt = f"""
    You are the Investigation Planner agent for DataSense AI.
    Design a comprehensive analytical investigation plan for dataset '{dataset_name}'.
    Numeric Columns: {num_cols}
    Categorical Columns: {cat_cols}
    Date Columns: {date_cols}
    
    Formulate 4 to 6 prioritized investigation steps covering:
    1. Temporal/Trend dynamics (if dates available)
    2. Categorical distribution and performance variances
    3. Multivariable dependency and correlation drivers
    4. Outlier and anomaly detection
    5. Natural clustering and segmentation
    
    Respond in JSON:
    {{
        "plan_title": "string",
        "investigation_steps": [
            {{
                "id": "step_1",
                "title": "string",
                "objective": "string",
                "target_columns": ["string"],
                "analysis_method": "string",
                "priority": "high" | "medium" | "low"
            }}
        ]
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are Agent 4 (Investigation Planner), an elite lead data scientist.")

    if not llm_res or "investigation_steps" not in llm_res:
        steps = []
        step_id = 1
        
        # 1. Temporal Analysis
        if date_cols and num_cols:
            steps.append({
                "id": f"step_{step_id}",
                "title": f"Analyze temporal trajectory of {num_cols[0]}",
                "objective": f"Assess longitudinal velocity, seasonality, and inflection points over '{date_cols[0]}'.",
                "target_columns": [date_cols[0], num_cols[0]],
                "analysis_method": "Time-Series Decomposition & Resampling",
                "priority": "high"
            })
            step_id += 1

        # 2. Categorical Breakdown
        if cat_cols and num_cols:
            steps.append({
                "id": f"step_{step_id}",
                "title": f"Compare {num_cols[0]} performance across {cat_cols[0]}",
                "objective": f"Identify high-performing versus lagging segments within '{cat_cols[0]}'.",
                "target_columns": [cat_cols[0], num_cols[0]],
                "analysis_method": "Grouped Aggregation & Variance Analysis",
                "priority": "high"
            })
            step_id += 1

        # 3. Correlation & Driver Analysis
        if len(num_cols) >= 2:
            steps.append({
                "id": f"step_{step_id}",
                "title": "Map pairwise metric correlations & feature dependencies",
                "objective": "Identify strong positive or negative collinearities between continuous variables.",
                "target_columns": num_cols[:4],
                "analysis_method": "Pearson & Spearman Correlation Matrix",
                "priority": "medium"
            })
            step_id += 1

        # 4. Outlier Detection
        if num_cols:
            steps.append({
                "id": f"step_{step_id}",
                "title": "Detect multivariate anomalies & boundary violations",
                "objective": "Isolate high-leverage outliers that distort statistical aggregates.",
                "target_columns": num_cols,
                "analysis_method": "Isolation Forest & IQR Range Bounds",
                "priority": "medium"
            })
            step_id += 1

        # 5. Cluster Segmentation
        if len(num_cols) >= 2:
            steps.append({
                "id": f"step_{step_id}",
                "title": "Discover natural behavioral clusters & archetypes",
                "objective": "Group observations into distinct unsupervised cohorts with similar multidimensional profiles.",
                "target_columns": num_cols,
                "analysis_method": "KMeans Clustering with PCA Projection",
                "priority": "low"
            })

        llm_res = {
            "plan_title": f"Autonomous Investigation Plan for {dataset_name}",
            "investigation_steps": steps
        }

    return {
        "agent": "Investigation Planner 🧠",
        "status": "completed",
        "plan_title": llm_res.get("plan_title", "Investigation Plan"),
        "steps_count": len(llm_res.get("investigation_steps", [])),
        "steps": llm_res.get("investigation_steps", [])
    }
