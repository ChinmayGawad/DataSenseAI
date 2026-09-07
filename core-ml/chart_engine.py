"""
Chart Engine: Generates Plotly-ready JSON specifications for dynamic dashboard visualization.
Provides concrete chart configurations with axis mappings, color schemes, and layout options.
Used by Agent 6 (Visualization Architect).
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


def build_bar_chart(
    df: pd.DataFrame,
    category_col: str,
    metric_col: str,
    title: str = "Bar Chart",
    aggregation: str = "sum"
) -> Dict[str, Any]:
    """Generates a Plotly spec for categorical vs metric aggregation."""
    try:
        if aggregation == "mean":
            grouped = df.groupby(category_col)[metric_col].mean().reset_index()
        elif aggregation == "count":
            grouped = df.groupby(category_col)[metric_col].count().reset_index()
        else:
            grouped = df.groupby(category_col)[metric_col].sum().reset_index()

        grouped = grouped.sort_values(by=metric_col, ascending=False).head(15)

        x_vals = [str(x) for x in grouped[category_col].tolist()]
        y_vals = [round(float(y), 2) for y in grouped[metric_col].tolist()]

        return {
            "type": "bar",
            "plotly_data": [
                {
                    "x": x_vals,
                    "y": y_vals,
                    "type": "bar",
                    "marker": {"color": "#6366f1"},
                    "name": metric_col
                }
            ],
            "plotly_layout": {
                "title": {"text": title, "font": {"size": 16, "color": "#f8fafc"}},
                "xaxis": {"title": category_col, "tickangle": -30, "color": "#94a3b8"},
                "yaxis": {"title": f"{aggregation.capitalize()} of {metric_col}", "color": "#94a3b8"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)",
                "font": {"color": "#f8fafc"},
                "margin": {"l": 50, "r": 20, "t": 40, "b": 80}
            }
        }
    except Exception as e:
        return {"type": "bar", "error": str(e), "plotly_data": [], "plotly_layout": {}}


def build_line_chart(
    df: pd.DataFrame,
    date_col: str,
    metric_col: str,
    title: str = "Time Series Trend",
    freq: str = "auto"
) -> Dict[str, Any]:
    """Generates a Plotly spec for chronological metric trends."""
    try:
        df_temp = df[[date_col, metric_col]].dropna().copy()
        df_temp[date_col] = pd.to_datetime(df_temp[date_col], errors="coerce")
        df_temp = df_temp.dropna().sort_values(by=date_col)

        if len(df_temp) > 100:
            df_temp = df_temp.set_index(date_col).resample('W').mean().dropna().reset_index()

        x_vals = [d.strftime('%Y-%m-%d') if hasattr(d, 'strftime') else str(d) for d in df_temp[date_col]]
        y_vals = [round(float(y), 2) for y in df_temp[metric_col]]

        return {
            "type": "line",
            "plotly_data": [
                {
                    "x": x_vals,
                    "y": y_vals,
                    "type": "scatter",
                    "mode": "lines+markers",
                    "line": {"color": "#38bdf8", "width": 2.5},
                    "marker": {"size": 5, "color": "#38bdf8"},
                    "name": metric_col
                }
            ],
            "plotly_layout": {
                "title": {"text": title, "font": {"size": 16, "color": "#f8fafc"}},
                "xaxis": {"title": date_col, "color": "#94a3b8"},
                "yaxis": {"title": metric_col, "color": "#94a3b8"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)",
                "font": {"color": "#f8fafc"},
                "margin": {"l": 50, "r": 20, "t": 40, "b": 60}
            }
        }
    except Exception as e:
        return {"type": "line", "error": str(e), "plotly_data": [], "plotly_layout": {}}


def build_scatter_chart(
    df: pd.DataFrame,
    x_col: str,
    y_col: str,
    category_col: Optional[str] = None,
    title: str = "Correlation Scatter Plot"
) -> Dict[str, Any]:
    """Generates a Plotly scatter plot with optional category coloring."""
    try:
        clean_df = df.dropna(subset=[x_col, y_col]).head(500)
        
        data = []
        if category_col and category_col in clean_df.columns:
            top_cats = clean_df[category_col].value_counts().head(5).index.tolist()
            colors = ["#6366f1", "#38bdf8", "#10b981", "#f59e0b", "#ec4899"]
            for i, cat in enumerate(top_cats):
                subset = clean_df[clean_df[category_col] == cat]
                data.append({
                    "x": [round(float(v), 2) for v in subset[x_col]],
                    "y": [round(float(v), 2) for v in subset[y_col]],
                    "mode": "markers",
                    "type": "scatter",
                    "name": str(cat),
                    "marker": {"size": 7, "color": colors[i % len(colors)], "opacity": 0.7}
                })
        else:
            data.append({
                "x": [round(float(v), 2) for v in clean_df[x_col]],
                "y": [round(float(v), 2) for v in clean_df[y_col]],
                "mode": "markers",
                "type": "scatter",
                "marker": {"size": 7, "color": "#6366f1", "opacity": 0.7},
                "name": f"{x_col} vs {y_col}"
            })

        return {
            "type": "scatter",
            "plotly_data": data,
            "plotly_layout": {
                "title": {"text": title, "font": {"size": 16, "color": "#f8fafc"}},
                "xaxis": {"title": x_col, "color": "#94a3b8"},
                "yaxis": {"title": y_col, "color": "#94a3b8"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)",
                "font": {"color": "#f8fafc"},
                "margin": {"l": 50, "r": 20, "t": 40, "b": 60}
            }
        }
    except Exception as e:
        return {"type": "scatter", "error": str(e), "plotly_data": [], "plotly_layout": {}}


def build_heatmap_chart(
    corr_matrix: Dict[str, Dict[str, float]],
    title: str = "Feature Correlation Matrix"
) -> Dict[str, Any]:
    """Generates a Plotly heatmap for correlation matrix."""
    try:
        cols = list(corr_matrix.keys())
        z_vals = [[corr_matrix[r].get(c, 0.0) for c in cols] for r in cols]

        return {
            "type": "heatmap",
            "plotly_data": [
                {
                    "z": z_vals,
                    "x": cols,
                    "y": cols,
                    "type": "heatmap",
                    "colorscale": "Viridis",
                    "zmin": -1.0,
                    "zmax": 1.0,
                    "colorbar": {"title": "Correlation", "thickness": 12}
                }
            ],
            "plotly_layout": {
                "title": {"text": title, "font": {"size": 16, "color": "#f8fafc"}},
                "xaxis": {"tickangle": -30, "color": "#94a3b8"},
                "yaxis": {"color": "#94a3b8"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)",
                "font": {"color": "#f8fafc"},
                "margin": {"l": 80, "r": 20, "t": 40, "b": 80}
            }
        }
    except Exception as e:
        return {"type": "heatmap", "error": str(e), "plotly_data": [], "plotly_layout": {}}


def build_cluster_chart(
    projection_points: List[Dict[str, Any]],
    k: int,
    title: str = "PCA Cluster Distribution"
) -> Dict[str, Any]:
    """Generates a Plotly 2D PCA cluster projection chart."""
    try:
        colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#38bdf8", "#8b5cf6"]
        data = []
        for c_id in range(k):
            pts = [p for p in projection_points if p.get("cluster") == c_id]
            data.append({
                "x": [p["pca_x"] for p in pts],
                "y": [p["pca_y"] for p in pts],
                "mode": "markers",
                "type": "scatter",
                "name": f"Cluster {c_id + 1}",
                "marker": {"size": 8, "color": colors[c_id % len(colors)], "opacity": 0.8}
            })

        return {
            "type": "cluster_scatter",
            "plotly_data": data,
            "plotly_layout": {
                "title": {"text": title, "font": {"size": 16, "color": "#f8fafc"}},
                "xaxis": {"title": "Principal Component 1", "color": "#94a3b8"},
                "yaxis": {"title": "Principal Component 2", "color": "#94a3b8"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)",
                "font": {"color": "#f8fafc"},
                "margin": {"l": 50, "r": 20, "t": 40, "b": 60}
            }
        }
    except Exception as e:
        return {"type": "cluster_scatter", "error": str(e), "plotly_data": [], "plotly_layout": {}}


# ==============================================================================
# SMART RULE-BASED CHART SELECTION ENGINE (Feature Spotlight #2)
# ==============================================================================

SMART_CHART_RULES = [
    {
        "detected_inputs": "Numeric + Numeric",
        "visual_type": "scatter",
        "display_name": "Scatter Plot",
        "rationale": "Scatter Plot auto-selected: optimal visual for bivariate numerical correlation, dispersion, and outlier clustering between two quantitative variables."
    },
    {
        "detected_inputs": "Date + Numeric",
        "visual_type": "line",
        "display_name": "Line Chart",
        "rationale": "Line Chart auto-selected: optimal visual for chronological progression, seasonal velocity, and temporal patterns across time series."
    },
    {
        "detected_inputs": "Category + Numeric",
        "visual_type": "bar",
        "display_name": "Bar Chart",
        "rationale": "Bar Chart auto-selected: optimal visual for ranking aggregate metrics across discrete categorical segments."
    },
    {
        "detected_inputs": "Single Numeric Variable",
        "visual_type": "histogram",
        "display_name": "Histogram",
        "rationale": "Histogram auto-selected: optimal visual for probability density, skewness, and frequency distribution of a single numerical variable."
    },
    {
        "detected_inputs": "Multiple Numeric Variables",
        "visual_type": "heatmap",
        "display_name": "Heatmap Matrix",
        "rationale": "Heatmap Matrix auto-selected: optimal visual for multi-variable covariance and collinearity across multiple numeric variables."
    }
]


def build_histogram_chart(
    df: pd.DataFrame,
    numeric_col: str,
    title: str = "Distribution Histogram",
    nbins: int = 25
) -> Dict[str, Any]:
    """Generates a Plotly spec for univariate numeric frequency distribution (Rule: Single Numeric Variable -> Histogram)."""
    try:
        clean_series = df[numeric_col].dropna()
        x_vals = [round(float(v), 2) for v in clean_series.tolist()[:1000]]

        return {
            "type": "histogram",
            "plotly_data": [
                {
                    "x": x_vals,
                    "type": "histogram",
                    "nbinsx": nbins,
                    "marker": {
                        "color": "#10b981",
                        "line": {"color": "#059669", "width": 1}
                    },
                    "name": numeric_col
                }
            ],
            "plotly_layout": {
                "title": {"text": title, "font": {"size": 16, "color": "#0f172a"}},
                "xaxis": {"title": numeric_col, "color": "#64748b", "gridcolor": "#e2e8f0"},
                "yaxis": {"title": "Frequency / Count", "color": "#64748b", "gridcolor": "#e2e8f0"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)",
                "bargap": 0.05,
                "font": {"color": "#334155"},
                "margin": {"l": 50, "r": 20, "t": 40, "b": 60}
            }
        }
    except Exception as e:
        return {"type": "histogram", "error": str(e), "plotly_data": [], "plotly_layout": {}}

