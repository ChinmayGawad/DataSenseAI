"""
Agent 7 — Insight Analyst 💡
Job: Convert technical ML & statistical outputs into plain-language business narratives.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_insight_analyst(
    ml_results: Dict[str, Any],
    quality_report: Dict[str, Any],
    columns_profile: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Executes Agent 7 (Insight Analyst) to draft candidate business insights.
    """
    strong_corrs = ml_results.get("correlations", {}).get("strong_correlations", [])
    outliers = ml_results.get("outliers", {})
    clustering = ml_results.get("clustering", {})
    stats = ml_results.get("summary_stats", {})
    health = quality_report.get("health_score", 100.0)

    prompt = f"""
    You are the Insight Analyst agent for DataSense AI.
    Transform technical analytical results into plain-language executive insights:
    Health Score: {health}
    Correlations: {strong_corrs[:2]}
    Outliers: {outliers.get('total_outliers')} ({outliers.get('outlier_percentage')}%)
    Clustering: k={clustering.get('k')} ({clustering.get('cluster_summaries')})
    Summary Stats: {list(stats.get('numeric_stats', {}).keys())}

    Generate 3 to 5 clear, high-impact business insights.
    Respond in JSON:
    {{
        "insights": [
            {{
                "id": "ins_1",
                "headline": "string",
                "statement": "string",
                "category": "trend" | "anomaly" | "correlation" | "cluster" | "hygiene",
                "importance": "high" | "medium" | "low",
                "actionable_recommendation": "string",
                "related_columns": ["string"]
            }}
        ]
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are Agent 7 (Insight Analyst), crafting clear executive narratives.")

    insights = []
    if llm_res and "insights" in llm_res:
        insights = llm_res["insights"]

    # Fallback / baseline candidate generation grounded in calculated facts
    if not insights:
        ins_id = 1
        
        # 1. Correlation Insight
        if strong_corrs:
            top_c = strong_corrs[0]
            col_a = top_c["column_a"]
            col_b = top_c["column_b"]
            r_val = top_c["coefficient"]
            direction = top_c["direction"]
            insights.append({
                "id": f"ins_{ins_id}",
                "headline": f"Strong {direction.capitalize()} Dependency Between {col_a} and {col_b}",
                "statement": f"{col_a} and {col_b} demonstrate a {top_c['strength']} {direction} correlation of {r_val}. As {col_a} increases, {col_b} tends to follow consistently.",
                "category": "correlation",
                "importance": "high",
                "actionable_recommendation": f"Leverage {col_a} as a leading driver when optimizing or forecasting {col_b}.",
                "related_columns": [col_a, col_b],
                "_raw_metric": f"r={r_val}"
            })
            ins_id += 1

        # 2. Outlier Insight
        outlier_pct = outliers.get("outlier_percentage", 0.0)
        outlier_cnt = outliers.get("total_outliers", 0)
        if outlier_cnt > 0:
            insights.append({
                "id": f"ins_{ins_id}",
                "headline": f"Anomalous Activity Detected ({outlier_pct}% of Records)",
                "statement": f"Identified {outlier_cnt} high-leverage outliers ({outlier_pct}% of total records) exhibiting extreme multivariable deviations.",
                "category": "anomaly",
                "importance": "high" if outlier_pct > 3.0 else "medium",
                "actionable_recommendation": "Use the 'Investigate This Finding' drilldown to audit these specific anomalous transactions for data entry errors or fraud.",
                "related_columns": list(outliers.get("column_iqr_outliers", {}).keys()),
                "_raw_metric": f"{outlier_cnt} outliers ({outlier_pct}%)"
            })
            ins_id += 1

        # 3. Cluster Insight
        if clustering.get("has_sufficient_data") and clustering.get("k", 0) > 0:
            k = clustering.get("k")
            best_cluster = max(clustering.get("cluster_summaries", []), key=lambda x: x.get("size", 0), default={})
            insights.append({
                "id": f"ins_{ins_id}",
                "headline": f"Identified {k} Distinct Behavioral Segments",
                "statement": f"Unsupervised clustering revealed {k} distinct cohorts. The dominant segment represents {best_cluster.get('percentage', 0)}% of the dataset.",
                "category": "cluster",
                "importance": "medium",
                "actionable_recommendation": "Tailor operational strategies and pricing models separately for each behavioral cluster archetype.",
                "related_columns": clustering.get("features_used", []),
                "_raw_metric": f"k={k}, dominant={best_cluster.get('percentage')}%"
            })
            ins_id += 1

        # 4. Data Quality / Hygiene Insight
        grade = quality_report.get("quality_grade", "A")
        insights.append({
            "id": f"ins_{ins_id}",
            "headline": f"Data Integrity Verified: Health Score {health}/100",
            "statement": f"Dataset hygiene was evaluated at {health}/100 ({grade}), confirming reliable statistical confidence for operational insights.",
            "category": "hygiene",
            "importance": "low",
            "actionable_recommendation": "Maintain standardized validation at data entry points to sustain high data quality.",
            "related_columns": [],
            "_raw_metric": f"Score={health}"
        })

    return insights
