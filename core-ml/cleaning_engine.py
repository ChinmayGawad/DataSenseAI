"""
Cleaning Engine: Executes rule-based and statistics-driven dataset cleaning.
Maintains an audit log of every decision and its mathematical rationale.
Used by Agent 3 (Data Cleaning Agent).
"""

from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import numpy as np


class CleaningReport:
    def __init__(
        self,
        original_shape: Tuple[int, int],
        cleaned_shape: Tuple[int, int],
        duplicates_removed: int,
        columns_dropped: List[str],
        imputation_actions: List[Dict[str, Any]],
        formatting_actions: List[Dict[str, Any]],
        total_actions_count: int,
    ):
        self.original_shape = original_shape
        self.cleaned_shape = cleaned_shape
        self.duplicates_removed = duplicates_removed
        self.columns_dropped = columns_dropped
        self.imputation_actions = imputation_actions
        self.formatting_actions = formatting_actions
        self.total_actions_count = total_actions_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "original_shape": {"rows": self.original_shape[0], "columns": self.original_shape[1]},
            "cleaned_shape": {"rows": self.cleaned_shape[0], "columns": self.cleaned_shape[1]},
            "duplicates_removed": self.duplicates_removed,
            "columns_dropped": self.columns_dropped,
            "imputation_actions": self.imputation_actions,
            "formatting_actions": self.formatting_actions,
            "total_actions_count": self.total_actions_count,
        }


def clean_dataset(
    df: pd.DataFrame,
    drop_high_null_threshold: float = 0.70,
    deduplicate: bool = True,
    auto_impute: bool = True,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans a dataset while documenting every mathematical rationale.
    Returns: (cleaned_df, cleaning_report_dict)
    """
    cleaned_df = df.copy()
    original_shape = cleaned_df.shape
    
    imputation_actions: List[Dict[str, Any]] = []
    formatting_actions: List[Dict[str, Any]] = []
    columns_dropped: List[str] = []

    # 1. Deduplicate
    duplicates_removed = 0
    if deduplicate:
        dup_count = int(cleaned_df.duplicated().sum())
        if dup_count > 0:
            cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
            duplicates_removed = dup_count
            formatting_actions.append({
                "type": "deduplication",
                "details": f"Removed {dup_count} exact duplicate rows.",
                "reason": "Redundant observations skew statistical distributions and correlations."
            })

    # 2. Check for columns with excessive missing values (> threshold)
    total_rows = len(cleaned_df)
    if total_rows > 0:
        for col in list(cleaned_df.columns):
            missing_pct = cleaned_df[col].isna().sum() / total_rows
            if missing_pct >= drop_high_null_threshold:
                cleaned_df = cleaned_df.drop(columns=[col])
                columns_dropped.append(str(col))
                formatting_actions.append({
                    "column": str(col),
                    "type": "drop_column",
                    "details": f"Dropped column '{col}' with {round(missing_pct * 100, 1)}% missing values.",
                    "reason": f"Column exceeds missing threshold of {int(drop_high_null_threshold * 100)}%."
                })

    # 3. Clean and parse dates
    for col in cleaned_df.columns:
        if pd.api.types.is_string_dtype(cleaned_df[col]) or cleaned_df[col].dtype == "object":
            sample = cleaned_df[col].dropna().head(20)
            if not sample.empty:
                try:
                    parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
                    if parsed.notna().sum() / len(sample) >= 0.7:
                        # Full column conversion
                        cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors="coerce", format="mixed")
                        formatting_actions.append({
                            "column": str(col),
                            "type": "standardize_datetime",
                            "details": f"Converted '{col}' to ISO datetime standard.",
                            "reason": "Enables time-series aggregation, seasonality detection, and date filtering."
                        })
                except Exception:
                    pass

    # 4. Handle Missing Values (Imputation)
    if auto_impute and total_rows > 0:
        for col in cleaned_df.columns:
            missing_count = int(cleaned_df[col].isna().sum())
            if missing_count == 0:
                continue

            series = cleaned_df[col]
            if pd.api.types.is_numeric_dtype(series):
                # Calculate skewness to decide Mean vs Median
                non_null = series.dropna()
                if len(non_null) > 2:
                    skewness = float(non_null.skew())
                    if abs(skewness) > 1.0:
                        # Skewed -> Use Median
                        median_val = float(non_null.median())
                        cleaned_df[col] = series.fillna(median_val)
                        imputation_actions.append({
                            "column": str(col),
                            "strategy": "median",
                            "fill_value": round(median_val, 4),
                            "missing_count": missing_count,
                            "reason": f"Median selected because distribution is significantly skewed (skewness = {round(skewness, 2)})."
                        })
                    else:
                        # Symmetric -> Use Mean
                        mean_val = float(non_null.mean())
                        cleaned_df[col] = series.fillna(mean_val)
                        imputation_actions.append({
                            "column": str(col),
                            "strategy": "mean",
                            "fill_value": round(mean_val, 4),
                            "missing_count": missing_count,
                            "reason": f"Mean selected because distribution is symmetric (skewness = {round(skewness, 2)})."
                        })
                else:
                    mode_val = non_null.iloc[0] if len(non_null) > 0 else 0
                    cleaned_df[col] = series.fillna(mode_val)
            elif pd.api.types.is_datetime64_any_dtype(series):
                # For datetime, forward fill or leave
                cleaned_df[col] = series.bfill().ffill()
                imputation_actions.append({
                    "column": str(col),
                    "strategy": "temporal_fill",
                    "missing_count": missing_count,
                    "reason": "Chronological forward/backward fill applied to maintain temporal continuity."
                })
            else:
                # Categorical / string -> mode or 'Unknown'
                non_null = series.dropna()
                if not non_null.empty:
                    mode_val = str(non_null.mode().iloc[0])
                    # If mode represents more than 40% of data, fill with mode, else fill with 'Unknown'
                    mode_freq = (non_null == mode_val).sum() / len(non_null)
                    if mode_freq >= 0.4:
                        cleaned_df[col] = series.fillna(mode_val)
                        imputation_actions.append({
                            "column": str(col),
                            "strategy": "mode",
                            "fill_value": mode_val,
                            "missing_count": missing_count,
                            "reason": f"Most frequent category '{mode_val}' represents {round(mode_freq * 100, 1)}% of observed records."
                        })
                    else:
                        cleaned_df[col] = series.fillna("Unknown")
                        imputation_actions.append({
                            "column": str(col),
                            "strategy": "constant",
                            "fill_value": "Unknown",
                            "missing_count": missing_count,
                            "reason": "No dominant category found; imputed with 'Unknown' category to preserve record count."
                        })

    report = CleaningReport(
        original_shape=original_shape,
        cleaned_shape=cleaned_df.shape,
        duplicates_removed=duplicates_removed,
        columns_dropped=columns_dropped,
        imputation_actions=imputation_actions,
        formatting_actions=formatting_actions,
        total_actions_count=len(imputation_actions) + len(formatting_actions) + (1 if duplicates_removed > 0 else 0),
    )

    return cleaned_df, report.to_dict()
