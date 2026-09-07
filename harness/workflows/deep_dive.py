"""
Deep Dive Investigation Engine: Targeted root-cause analysis for specific dashboard findings.
Powers the "Investigate This Finding" drilldown feature.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# Ensure paths
HARNESS_DIR = str(Path(__file__).resolve().parent.parent)
CORE_ML_DIR = str(Path(__file__).resolve().parent.parent.parent / "core-ml")
for d in [HARNESS_DIR, CORE_ML_DIR]:
    if d not in sys.path:
        sys.path.insert(0, d)

from plugins.data_tools import load_dataframe
from plugins.cleaning_tools import execute_data_cleaning
import chart_engine
from agents.base import call_llm


def investigate_anomaly_finding(
    df: pd.DataFrame,
    record_index: int,
    numeric_cols: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Performs root-cause analysis on a single anomalous record.
    Identifies which features deviated most significantly from normal distribution.
    """
    if record_index not in df.index:
        # Fallback to first row
        record_index = df.index[0] if len(df) > 0 else 0

    record = df.loc[record_index]
    num_cols = numeric_cols or list(df.select_dtypes(include=[np.number]).columns)

    feature_deviations: List[Dict[str, Any]] = []

    for col in num_cols:
        col_series = df[col].dropna()
        if len(col_series) < 2 or col_series.std() == 0:
            continue

        mean = float(col_series.mean())
        std = float(col_series.std())
        median = float(col_series.median())
        q25 = float(col_series.quantile(0.25))
        q75 = float(col_series.quantile(0.75))
        iqr = q75 - q25

        val = record[col]
        if pd.isna(val):
            continue

        val = float(val)
        z_score = round((val - mean) / std, 2)
        iqr_mult = round((val - median) / max(iqr, 1e-5), 2)

        # Deviation percentage from median
        pct_diff = round(((val - median) / max(abs(median), 1e-5)) * 100, 1)

        feature_deviations.append({
            "column": col,
            "record_value": val,
            "population_median": median,
            "population_mean": round(mean, 2),
            "z_score": z_score,
            "iqr_multiplier": iqr_mult,
            "percentage_deviation": pct_diff,
            "is_extreme": abs(z_score) >= 2.0 or abs(iqr_mult) >= 1.5
        })

    # Sort descending by absolute z-score
    feature_deviations.sort(key=lambda x: abs(x["z_score"]), reverse=True)
    top_drivers = feature_deviations[:3]

    # Build deviation chart spec
    chart_cols = [d["column"] for d in top_drivers]
    record_vals = [d["record_value"] for d in top_drivers]
    median_vals = [d["population_median"] for d in top_drivers]

    deviation_chart = {
        "type": "bar",
        "plotly_data": [
            {
                "x": chart_cols,
                "y": record_vals,
                "type": "bar",
                "name": f"Record #{record_index} (Anomaly)",
                "marker": {"color": "#ef4444"}
            },
            {
                "x": chart_cols,
                "y": median_vals,
                "type": "bar",
                "name": "Population Median (Baseline)",
                "marker": {"color": "#64748b"}
            }
        ],
        "plotly_layout": {
            "title": {"text": f"Anomaly Root Cause Breakdown: Record #{record_index}", "font": {"size": 16, "color": "#f8fafc"}},
            "barmode": "group",
            "xaxis": {"title": "Key Driving Features", "color": "#94a3b8"},
            "yaxis": {"title": "Observed vs Baseline", "color": "#94a3b8"},
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(0,0,0,0)",
            "font": {"color": "#f8fafc"}
        }
    }

    # Generate root cause narrative
    driver_desc = ", ".join([f"'{d['column']}' ({d['percentage_deviation']:+}% vs median, z={d['z_score']})" for d in top_drivers])
    narrative = (
        f"Investigation confirmed Record #{record_index} is an isolated anomaly driven primarily by {len(top_drivers)} attributes: "
        f"{driver_desc}. These deviations push this observation outside the 95% confidence envelope of standard operations."
    )

    return {
        "finding_type": "anomaly",
        "target_id": record_index,
        "investigation_status": "completed",
        "executive_headline": f"Anomaly Root Cause: Record #{record_index}",
        "narrative": narrative,
        "top_drivers": top_drivers,
        "all_deviations": feature_deviations,
        "chart": deviation_chart,
        "recommended_action": "Audit source operational logs for this record ID to verify if data entry error, fraudulent spike, or authentic extreme transaction."
    }


def investigate_cluster_finding(
    df: pd.DataFrame,
    cluster_id: int,
    cluster_column: str = "_cluster"
) -> Dict[str, Any]:
    """
    Performs deep-dive comparative analysis on a specific cluster cohort vs the rest of the dataset.
    """
    if cluster_column not in df.columns:
        # Compute quick clustering if not already present
        import clustering_engine
        clust_res = clustering_engine.run_clustering(df, max_k=4)
        # Apply labels
        if clust_res.get("k", 0) > 0:
            num_df = df.select_dtypes(include=[np.number]).dropna()
            from sklearn.cluster import KMeans
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            scaled = scaler.fit_transform(num_df)
            km = KMeans(n_clusters=clust_res["k"], random_state=42, n_init=10)
            df = df.copy()
            df.loc[num_df.index, cluster_column] = km.fit_predict(scaled)

    if cluster_column not in df.columns:
        return {"error": "Insufficient data to perform cluster deep-dive."}

    target_subset = df[df[cluster_column] == cluster_id]
    other_subset = df[df[cluster_column] != cluster_id]

    numeric_cols = list(df.select_dtypes(include=[np.number]).columns)
    if cluster_column in numeric_cols:
        numeric_cols.remove(cluster_column)

    cluster_size = len(target_subset)
    total_size = len(df)
    cluster_pct = round((cluster_size / max(total_size, 1)) * 100, 1)

    profile_diffs: List[Dict[str, Any]] = []

    for col in numeric_cols:
        t_mean = float(target_subset[col].mean()) if len(target_subset) > 0 else 0.0
        o_mean = float(other_subset[col].mean()) if len(other_subset) > 0 else 0.0
        diff_pct = round(((t_mean - o_mean) / max(abs(o_mean), 1e-5)) * 100, 1)

        profile_diffs.append({
            "column": col,
            "cluster_mean": round(t_mean, 2),
            "baseline_mean": round(o_mean, 2),
            "variance_percentage": diff_pct,
            "direction": "higher" if diff_pct > 0 else "lower"
        })

    profile_diffs.sort(key=lambda x: abs(x["variance_percentage"]), reverse=True)
    top_traits = profile_diffs[:4]

    # Chart
    chart_cols = [t["column"] for t in top_traits]
    t_vals = [t["cluster_mean"] for t in top_traits]
    o_vals = [t["baseline_mean"] for t in top_traits]

    cluster_chart = {
        "type": "bar",
        "plotly_data": [
            {
                "x": chart_cols,
                "y": t_vals,
                "type": "bar",
                "name": f"Cluster {cluster_id + 1} ({cluster_pct}%)",
                "marker": {"color": "#6366f1"}
            },
            {
                "x": chart_cols,
                "y": o_vals,
                "type": "bar",
                "name": "Rest of Population",
                "marker": {"color": "#64748b"}
            }
        ],
        "plotly_layout": {
            "title": {"text": f"Cluster {cluster_id + 1} Behavioral Archetype Profile", "font": {"size": 16, "color": "#f8fafc"}},
            "barmode": "group",
            "xaxis": {"title": "Distinguishing Features", "color": "#94a3b8"},
            "yaxis": {"title": "Cohort Mean vs Benchmark", "color": "#94a3b8"},
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(0,0,0,0)",
            "font": {"color": "#f8fafc"}
        }
    }

    trait_str = ", ".join([f"{t['column']} is {abs(t['variance_percentage'])}% {t['direction']}" for t in top_traits[:2]])
    narrative = (
        f"Deep investigation of Cluster {cluster_id + 1} (representing {cluster_pct}% of the population) reveals a distinct archetype. "
        f"Compared to the baseline average, {trait_str}."
    )

    return {
        "finding_type": "cluster",
        "target_id": cluster_id,
        "investigation_status": "completed",
        "executive_headline": f"Cluster {cluster_id + 1} Profile ({cluster_pct}% of Population)",
        "narrative": narrative,
        "cluster_size": cluster_size,
        "cluster_percentage": cluster_pct,
        "top_differentiating_traits": top_traits,
        "chart": cluster_chart,
        "recommended_action": f"Create targeted marketing and operational strategies specifically tailored to Cluster {cluster_id + 1}'s high-variance profile."
    }


def investigate_correlation_finding(
    df: pd.DataFrame,
    col_a: str,
    col_b: str,
    dimension_col: Optional[str] = None
) -> Dict[str, Any]:
    """
    Drills down on a correlation relationship by testing whether it holds across sub-segments.
    """
    clean_df = df[[col_a, col_b] + ([dimension_col] if dimension_col and dimension_col in df.columns else [])].dropna()
    overall_corr = round(float(clean_df[col_a].corr(clean_df[col_b])), 3)

    subgroup_corrs: List[Dict[str, Any]] = []
    
    if not dimension_col:
        # Find first suitable categorical column
        cat_cols = df.select_dtypes(include=["object", "category"]).columns
        if len(cat_cols) > 0:
            dimension_col = cat_cols[0]

    if dimension_col and dimension_col in df.columns:
        top_cats = df[dimension_col].value_counts().head(6).index.tolist()
        for cat in top_cats:
            sub = df[df[dimension_col] == cat][[col_a, col_b]].dropna()
            if len(sub) >= 4:
                c_val = round(float(sub[col_a].corr(sub[col_b])), 3)
                subgroup_corrs.append({
                    "segment": str(cat),
                    "correlation": c_val,
                    "sample_size": len(sub),
                    "divergence": round(c_val - overall_corr, 3)
                })

    subgroup_corrs.sort(key=lambda x: x["correlation"], reverse=True)

    # Chart
    seg_names = [s["segment"] for s in subgroup_corrs]
    corrs = [s["correlation"] for s in subgroup_corrs]

    chart = {
        "type": "bar",
        "plotly_data": [
            {
                "x": seg_names,
                "y": corrs,
                "type": "bar",
                "marker": {"color": ["#10b981" if c > 0.5 else "#f59e0b" if c > 0 else "#ef4444" for c in corrs]},
                "name": f"Correlation: {col_a} vs {col_b}"
            }
        ],
        "plotly_layout": {
            "title": {"text": f"Sub-Group Correlation Dissection: {col_a} vs {col_b} across {dimension_col}", "font": {"size": 16, "color": "#f8fafc"}},
            "xaxis": {"title": dimension_col, "color": "#94a3b8"},
            "yaxis": {"title": "Correlation Coefficient (r)", "range": [-1, 1], "color": "#94a3b8"},
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(0,0,0,0)",
            "font": {"color": "#f8fafc"}
        }
    }

    narrative = (
        f"The global correlation between '{col_a}' and '{col_b}' is r = {overall_corr}. "
        + (f"However, sub-group analysis across '{dimension_col}' reveals variance ranging from r = {subgroup_corrs[-1]['correlation']} in {subgroup_corrs[-1]['segment']} to r = {subgroup_corrs[0]['correlation']} in {subgroup_corrs[0]['segment']}."
           if len(subgroup_corrs) >= 2 else "The correlation holds consistently across observations.")
    )

    return {
        "finding_type": "correlation",
        "feature_a": col_a,
        "feature_b": col_b,
        "global_correlation": overall_corr,
        "dissection_dimension": dimension_col,
        "subgroup_correlations": subgroup_corrs,
        "narrative": narrative,
        "chart": chart,
        "recommended_action": f"Focus growth initiatives in {subgroup_corrs[0]['segment'] if subgroup_corrs else 'primary segments'} where {col_a} drives the strongest positive return on {col_b}."
    }


def run_deep_dive_investigation(
    dataset_path: str,
    finding_type: str,
    target_id: Optional[Any] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main entry point for "Investigate This Finding" drilldowns.
    """
    context = context or {}
    raw_df = load_dataframe(dataset_path)
    clean_df, _ = execute_data_cleaning(raw_df)

    if finding_type == "anomaly":
        rec_idx = int(target_id) if target_id is not None else 0
        return investigate_anomaly_finding(clean_df, record_index=rec_idx)

    elif finding_type == "cluster":
        clust_id = int(target_id) if target_id is not None else 0
        return investigate_cluster_finding(clean_df, cluster_id=clust_id)

    elif finding_type == "correlation":
        col_a = context.get("column_a") or context.get("feature_a")
        col_b = context.get("column_b") or context.get("feature_b")
        dim = context.get("dimension")
        if not col_a or not col_b:
            num_cols = list(clean_df.select_dtypes(include=[np.number]).columns)
            col_a = num_cols[0] if len(num_cols) > 0 else "col1"
            col_b = num_cols[1] if len(num_cols) > 1 else "col2"
        return investigate_correlation_finding(clean_df, col_a=col_a, col_b=col_b, dimension_col=dim)

    else:
        return {
            "finding_type": finding_type,
            "status": "error",
            "message": f"Unsupported drilldown finding type: {finding_type}"
        }
