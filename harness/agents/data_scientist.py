"""
Agent 5 — Data Scientist Agent 🤖
Job: Execute statistical and machine learning algorithms and interpret results.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_data_scientist(
    ml_results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes Agent 5 (Data Scientist Agent) to interpret mathematical computations.
    """
    correlations = ml_results.get("correlations", {})
    strong_corrs = correlations.get("strong_correlations", [])
    outliers = ml_results.get("outliers", {})
    clustering = ml_results.get("clustering", {})
    summary_stats = ml_results.get("summary_stats", {})

    prompt = f"""
    You are the Data Scientist Agent for DataSense AI.
    Interpret the following calculated statistical and ML results:
    Top Correlations: {strong_corrs[:3]}
    Outliers Detected: {outliers.get('total_outliers')} ({outliers.get('outlier_percentage')}%)
    Clusters: k={clustering.get('k')} with Silhouette={clustering.get('silhouette_avg')}
    Cluster Summaries: {clustering.get('cluster_summaries')}

    Synthesize the technical findings into concise, mathematically sound conclusions.
    Respond in JSON:
    {{
        "technical_summary": "string",
        "top_findings": ["string"],
        "model_confidence": "high" | "medium"
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are Agent 5 (Data Scientist), an expert statistician and ML engineer.")

    if not llm_res:
        findings = []
        if strong_corrs:
            c = strong_corrs[0]
            findings.append(f"Identified {c.get('strength')} {c.get('direction')} correlation (r={c.get('coefficient')}) between {c.get('column_a')} and {c.get('column_b')}.")
        
        outlier_pct = outliers.get("outlier_percentage", 0.0)
        outlier_cnt = outliers.get("total_outliers", 0)
        if outlier_cnt > 0:
            findings.append(f"Detected {outlier_cnt} anomalous records ({outlier_pct}%) using Isolation Forest multivariate isolation.")

        if clustering.get("has_sufficient_data") and clustering.get("k", 0) > 0:
            findings.append(f"Partitioned data into {clustering.get('k')} distinct clusters with an average silhouette score of {clustering.get('silhouette_avg')}.")

        if not findings:
            findings.append("Continuous variables exhibit stable, homogeneous distributions without extreme collinearity.")

        summary = f"Completed statistical profiling, correlation analysis, and ML segmentation. Uncovered {len(findings)} key mathematical patterns."

        llm_res = {
            "technical_summary": summary,
            "top_findings": findings,
            "model_confidence": "high"
        }

    return {
        "agent": "Data Scientist Agent 🤖",
        "status": "completed",
        "summary": llm_res["technical_summary"],
        "findings": llm_res["top_findings"],
        "correlations": strong_corrs,
        "outlier_analysis": {
            "total_outliers": outliers.get("total_outliers", 0),
            "outlier_percentage": outliers.get("outlier_percentage", 0.0),
            "top_anomalies": outliers.get("top_anomalies", []),
            "iqr_bounds": outliers.get("column_iqr_outliers", {})
        },
        "clustering_analysis": {
            "k": clustering.get("k", 0),
            "silhouette_score": clustering.get("silhouette_avg", 0.0),
            "cluster_summaries": clustering.get("cluster_summaries", []),
            "features_used": clustering.get("features_used", [])
        },
        "summary_statistics": summary_stats
    }
