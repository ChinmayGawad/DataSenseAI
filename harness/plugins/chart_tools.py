"""
Chart Plugin: Assembles Plotly charts dynamically based on column metadata and ML findings.
Provides Agent 6 (Visualization Architect) with ready-to-render dashboard visualizations.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd

CORE_ML_DIR = str(Path(__file__).resolve().parent.parent.parent / "core-ml")
if CORE_ML_DIR not in sys.path:
    sys.path.insert(0, CORE_ML_DIR)

import chart_engine


def build_dashboard_charts(
    df: pd.DataFrame,
    columns_info: Dict[str, Any],
    ml_results: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Constructs a suite of targeted Plotly visualizations tailored to the dataset.
    """
    charts: List[Dict[str, Any]] = []
    numeric_cols = columns_info.get("numeric_columns", [])
    categorical_cols = columns_info.get("categorical_columns", [])
    datetime_cols = columns_info.get("datetime_columns", [])
    
    # 1. Time-series chart if date column exists
    if datetime_cols and numeric_cols:
        date_col = datetime_cols[0]
        metric_col = numeric_cols[0]
        spec = chart_engine.build_line_chart(
            df=df,
            date_col=date_col,
            metric_col=metric_col,
            title=f"Temporal Trend: {metric_col} over {date_col}"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": f"chart_ts_{date_col}_{metric_col}",
                "title": f"Temporal Trend: {metric_col} over {date_col}",
                "type": "line",
                "x_axis": date_col,
                "y_axis": metric_col,
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Line charts effectively expose cyclicality, velocity, and time-series anomalies across '{date_col}'.",
                "priority_order": 1
            })

    # 2. Categorical aggregation bar chart
    if categorical_cols and numeric_cols:
        cat_col = categorical_cols[0]
        metric_col = numeric_cols[0]
        spec = chart_engine.build_bar_chart(
            df=df,
            category_col=cat_col,
            metric_col=metric_col,
            title=f"{metric_col} Breakdown by {cat_col}",
            aggregation="sum"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": f"chart_bar_{cat_col}_{metric_col}",
                "title": f"{metric_col} Breakdown by {cat_col}",
                "type": "bar",
                "x_axis": cat_col,
                "y_axis": metric_col,
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Bar charts provide the clearest visual ranking of aggregate '{metric_col}' across discrete categories of '{cat_col}'.",
                "priority_order": 2
            })

    # 3. Top correlation scatter plot
    strong_corrs = ml_results.get("correlations", {}).get("strong_correlations", [])
    if strong_corrs:
        top_corr = strong_corrs[0]
        col_a = top_corr["column_a"]
        col_b = top_corr["column_b"]
        cat_filter = categorical_cols[0] if categorical_cols else None
        
        spec = chart_engine.build_scatter_chart(
            df=df,
            x_col=col_a,
            y_col=col_b,
            category_col=cat_filter,
            title=f"Correlation Relationship: {col_a} vs {col_b} (r={top_corr['coefficient']})"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": f"chart_scatter_{col_a}_{col_b}",
                "title": f"Correlation Relationship: {col_a} vs {col_b}",
                "type": "scatter",
                "x_axis": col_a,
                "y_axis": col_b,
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Scatter plot with linear dispersion highlights the {top_corr['strength']} {top_corr['direction']} correlation (r={top_corr['coefficient']}) between '{col_a}' and '{col_b}'.",
                "priority_order": 3
            })

    # 4. Correlation Heatmap (if >= 3 numeric columns)
    corr_matrix = ml_results.get("correlations", {}).get("matrix", {})
    if len(corr_matrix) >= 3:
        spec = chart_engine.build_heatmap_chart(
            corr_matrix=corr_matrix,
            title="Multi-Variable Correlation Matrix"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": "chart_heatmap_correlation",
                "title": "Multi-Variable Correlation Matrix",
                "type": "heatmap",
                "x_axis": "Features",
                "y_axis": "Features",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": "Heatmaps compress multidimensional pairwise dependencies into a single comparative glance, highlighting collinearity.",
                "priority_order": 4
            })

    # 5. Cluster Scatter Plot (PCA 2D projection)
    clustering = ml_results.get("clustering", {})
    if clustering.get("has_sufficient_data") and clustering.get("projection_points"):
        spec = chart_engine.build_cluster_chart(
            projection_points=clustering["projection_points"],
            k=clustering["k"],
            title=f"KMeans Cluster Distribution (k={clustering['k']}, Silhouette={clustering['silhouette_avg']})"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": "chart_pca_clusters",
                "title": f"Unsupervised Clustering (k={clustering['k']})",
                "type": "cluster_scatter",
                "x_axis": "PCA Component 1",
                "y_axis": "PCA Component 2",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"PCA projection visualizes multivariate segmentation in 2D space, demonstrating {clustering['k']} distinct behavioural groupings.",
                "priority_order": 5
            })

    return charts
