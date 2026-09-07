"""
Chart Plugin: Assembles Plotly charts dynamically using the Smart Rule-Based Chart Selection Engine.
Adheres strictly to the Automated Visualization Decision Rules:
1. Numeric + Numeric          -> Scatter Plot
2. Date + Numeric             -> Line Chart
3. Category + Numeric         -> Bar Chart
4. Single Numeric Variable    -> Histogram
5. Multiple Numeric Variables -> Heatmap Matrix
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
    Constructs an optimal suite of Plotly charts by strictly applying the
    Smart Rule-Based Chart Selection Engine decision rules.
    """
    charts: List[Dict[str, Any]] = []
    numeric_cols = columns_info.get("numeric_columns", [])
    categorical_cols = columns_info.get("categorical_columns", [])
    datetime_cols = columns_info.get("datetime_columns", [])

    # =========================================================================
    # RULE 1: Date + Numeric -> Line Chart
    # =========================================================================
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
                "detected_inputs": "Date + Numeric",
                "decision_rule": "Date + Numeric → Line Chart",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Auto-selected Line Chart: Chronological inputs ({date_col} + {metric_col}) are best represented linearly to expose temporal velocity, seasonality, and time-series fluctuations without user configuration.",
                "key_takeaway": f"Temporal progression of {metric_col} tracked across {date_col}.",
                "priority_order": 1
            })

    # =========================================================================
    # RULE 2: Category + Numeric -> Bar Chart
    # =========================================================================
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
                "detected_inputs": "Category + Numeric",
                "decision_rule": "Category + Numeric → Bar Chart",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Auto-selected Bar Chart: Categorical grouping ({cat_col}) against numerical metric ({metric_col}) provides the highest cognitive clarity for aggregate comparison and Pareto ranking.",
                "key_takeaway": f"Visual ranking of total {metric_col} segmented by discrete {cat_col}.",
                "priority_order": 2
            })

    # =========================================================================
    # RULE 3: Numeric + Numeric -> Scatter Plot
    # =========================================================================
    if len(numeric_cols) >= 2:
        strong_corrs = ml_results.get("correlations", {}).get("strong_correlations", [])
        if strong_corrs:
            top_corr = strong_corrs[0]
            col_a = top_corr["column_a"]
            col_b = top_corr["column_b"]
            r_val = top_corr.get("coefficient", 0.0)
            corr_text = f"(r={r_val})"
        else:
            col_a = numeric_cols[0]
            col_b = numeric_cols[1]
            corr_text = ""

        cat_filter = categorical_cols[0] if categorical_cols else None
        spec = chart_engine.build_scatter_chart(
            df=df,
            x_col=col_a,
            y_col=col_b,
            category_col=cat_filter,
            title=f"Correlation Scatter: {col_a} vs {col_b} {corr_text}".strip()
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": f"chart_scatter_{col_a}_{col_b}",
                "title": f"Correlation Scatter: {col_a} vs {col_b}",
                "type": "scatter",
                "x_axis": col_a,
                "y_axis": col_b,
                "detected_inputs": "Numeric + Numeric",
                "decision_rule": "Numeric + Numeric → Scatter Plot",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Auto-selected Scatter Plot: Two continuous numerical dimensions ({col_a} and {col_b}) require a Cartesian scatter visual to expose bivariate correlation, heteroscedasticity, and outlier clusters.",
                "key_takeaway": f"Bivariate numerical dispersion and correlation between {col_a} and {col_b}.",
                "priority_order": 3
            })

    # =========================================================================
    # RULE 4: Single Numeric Variable -> Histogram
    # =========================================================================
    if numeric_cols:
        target_metric = numeric_cols[0]
        # If multiple numeric columns, pick the one with highest variance or first
        spec = chart_engine.build_histogram_chart(
            df=df,
            numeric_col=target_metric,
            title=f"Univariate Distribution: {target_metric} Spread"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": f"chart_hist_{target_metric}",
                "title": f"Distribution Spread: {target_metric}",
                "type": "histogram",
                "x_axis": target_metric,
                "y_axis": "Frequency",
                "detected_inputs": "Single Numeric Variable",
                "decision_rule": "Single Numeric Variable → Histogram",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"Auto-selected Histogram: Single quantitative variable ({target_metric}) is autonomously modeled with discrete binning to evaluate skewness, normality, modal distribution, and tail outliers.",
                "key_takeaway": f"Statistical distribution and frequency density of {target_metric}.",
                "priority_order": 4
            })

    # =========================================================================
    # RULE 5: Multiple Numeric Variables -> Heatmap Matrix
    # =========================================================================
    corr_matrix = ml_results.get("correlations", {}).get("matrix", {})
    if len(corr_matrix) >= 3 or len(numeric_cols) >= 3:
        # Build matrix if missing
        if not corr_matrix and len(numeric_cols) >= 3:
            sub_df = df[numeric_cols].dropna()
            corr_df = sub_df.corr()
            corr_matrix = corr_df.to_dict()

        if corr_matrix:
            spec = chart_engine.build_heatmap_chart(
                corr_matrix=corr_matrix,
                title="Multivariate Correlation Matrix"
            )
            if spec.get("plotly_data"):
                charts.append({
                    "id": "chart_heatmap_correlation",
                    "title": "Multivariate Correlation Matrix",
                    "type": "heatmap",
                    "x_axis": "Features",
                    "y_axis": "Features",
                    "detected_inputs": "Multiple Numeric Variables",
                    "decision_rule": "Multiple Numeric Variables → Heatmap Matrix",
                    "plotly_data": spec["plotly_data"],
                    "plotly_layout": spec["plotly_layout"],
                    "why_chosen": "Auto-selected Heatmap Matrix: When 3 or more continuous numeric variables are detected, a symmetric heat matrix compresses all pairwise Pearson coefficients into an instantaneous collinearity scan.",
                    "key_takeaway": "Multivariate cross-correlation matrix across all numerical attributes.",
                    "priority_order": 5
                })

    # Optional Supplement: Cluster Scatter Plot if ML clustering ran successfully
    clustering = ml_results.get("clustering", {})
    if clustering.get("has_sufficient_data") and clustering.get("projection_points"):
        spec = chart_engine.build_cluster_chart(
            projection_points=clustering["projection_points"],
            k=clustering["k"],
            title=f"KMeans Cluster Projection (k={clustering['k']})"
        )
        if spec.get("plotly_data"):
            charts.append({
                "id": "chart_pca_clusters",
                "title": f"Unsupervised Clustering (k={clustering['k']})",
                "type": "cluster_scatter",
                "x_axis": "PCA Component 1",
                "y_axis": "PCA Component 2",
                "detected_inputs": "Unsupervised Multivariate",
                "decision_rule": "Multivariate Feature Space → PCA Cluster Projection",
                "plotly_data": spec["plotly_data"],
                "plotly_layout": spec["plotly_layout"],
                "why_chosen": f"PCA 2D projection visualizes high-dimensional unsupervised clustering, isolating {clustering['k']} natural behavioural clusters.",
                "key_takeaway": f"Autonomous segmentation identifying {clustering['k']} behavioural cohorts.",
                "priority_order": 6
            })

    return charts
