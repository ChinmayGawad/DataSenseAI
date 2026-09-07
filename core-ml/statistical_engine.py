"""
Statistical Engine: Computes summary statistics, distributions, and correlation matrices.
Generates ground-truth numerical facts used by Agent 5 (Scientist) and Agent 7 & 8 (Insight/FactChecker).
"""

from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np


def generate_summary_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes rigorous statistical profile for numeric and categorical columns.
    """
    numeric_stats: Dict[str, Any] = {}
    categorical_stats: Dict[str, Any] = {}

    for col in df.columns:
        series = df[col]
        col_name = str(col)

        if pd.api.types.is_numeric_dtype(series):
            clean_s = series.dropna()
            if len(clean_s) > 0:
                q25 = float(clean_s.quantile(0.25))
                q75 = float(clean_s.quantile(0.75))
                iqr = q75 - q25
                skewness = float(clean_s.skew()) if len(clean_s) > 2 else 0.0

                numeric_stats[col_name] = {
                    "count": int(len(clean_s)),
                    "mean": round(float(clean_s.mean()), 4),
                    "std": round(float(clean_s.std()), 4) if len(clean_s) > 1 else 0.0,
                    "min": round(float(clean_s.min()), 4),
                    "q25": round(q25, 4),
                    "median": round(float(clean_s.median()), 4),
                    "q75": round(q75, 4),
                    "max": round(float(clean_s.max()), 4),
                    "iqr": round(iqr, 4),
                    "skewness": round(skewness, 2),
                    "sum": round(float(clean_s.sum()), 4),
                }
        elif series.dtype == "object" or isinstance(series.dtype, pd.CategoricalDtype):
            clean_s = series.dropna().astype(str)
            if len(clean_s) > 0:
                top_counts = clean_s.value_counts().head(5).to_dict()
                mode_val = clean_s.mode().iloc[0] if not clean_s.empty else None
                categorical_stats[col_name] = {
                    "count": int(len(clean_s)),
                    "unique": int(clean_s.nunique()),
                    "mode": mode_val,
                    "top_categories": {k: int(v) for k, v in top_counts.items()},
                }

    return {
        "numeric_stats": numeric_stats,
        "categorical_stats": categorical_stats,
    }


def calculate_correlations(df: pd.DataFrame, min_threshold: float = 0.5) -> Dict[str, Any]:
    """
    Calculates Pearson and Spearman correlations between numeric features.
    Identifies notable strong relationships for visualization and insight generation.
    """
    numeric_df = df.select_dtypes(include=[np.number])
    
    # Exclude constant or insufficient variance columns safely
    valid_cols = []
    for c in numeric_df.columns:
        s = numeric_df[c].dropna()
        if len(s) > 1 and s.std() > 0:
            valid_cols.append(c)
    numeric_df = numeric_df[valid_cols]

    if numeric_df.shape[1] < 2 or len(numeric_df) < 3:
        return {
            "matrix": {},
            "columns": [],
            "strong_correlations": [],
            "has_sufficient_data": False
        }

    corr_matrix = numeric_df.corr(method="pearson").round(3)
    
    matrix_dict = {}
    for col in corr_matrix.columns:
        matrix_dict[col] = corr_matrix[col].to_dict()

    strong_correlations: List[Dict[str, Any]] = []
    columns = list(numeric_df.columns)
    
    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            col1 = columns[i]
            col2 = columns[j]
            val = corr_matrix.loc[col1, col2]
            
            if not np.isnan(val) and abs(val) >= min_threshold:
                direction = "positive" if val > 0 else "negative"
                strength = "very strong" if abs(val) >= 0.8 else "strong" if abs(val) >= 0.6 else "moderate"
                
                strong_correlations.append({
                    "column_a": col1,
                    "column_b": col2,
                    "coefficient": float(val),
                    "direction": direction,
                    "strength": strength,
                    "description": f"{col1} and {col2} exhibit a {strength} {direction} correlation of {val}."
                })

    # Sort descending by absolute coefficient
    strong_correlations.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    return {
        "matrix": matrix_dict,
        "columns": columns,
        "strong_correlations": strong_correlations,
        "has_sufficient_data": True
    }
