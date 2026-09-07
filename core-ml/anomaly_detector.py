"""
Anomaly Detector: Identifies multi-dimensional and univariate outliers using
Isolation Forest and IQR methods.
Used by Agent 5 (Scientist) and for the "Investigate This Finding" drilldown.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


class OutlierReport:
    def __init__(
        self,
        total_outliers: int,
        outlier_percentage: float,
        outlier_indices: List[int],
        column_iqr_outliers: Dict[str, Any],
        top_anomalies: List[Dict[str, Any]],
    ):
        self.total_outliers = total_outliers
        self.outlier_percentage = outlier_percentage
        self.outlier_indices = outlier_indices
        self.column_iqr_outliers = column_iqr_outliers
        self.top_anomalies = top_anomalies

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_outliers": self.total_outliers,
            "outlier_percentage": round(self.outlier_percentage, 2),
            "outlier_indices": self.outlier_indices[:100],
            "column_iqr_outliers": self.column_iqr_outliers,
            "top_anomalies": self.top_anomalies[:10],
        }


def detect_outliers(df: pd.DataFrame, contamination: float = 0.05) -> Dict[str, Any]:
    """
    Performs dual-method anomaly detection:
    1. IQR per numeric column (univariate)
    2. Isolation Forest across all numeric features (multivariate)
    """
    numeric_df = df.select_dtypes(include=[np.number]).dropna()
    total_rows = len(df)

    if numeric_df.empty or total_rows < 10 or numeric_df.shape[1] < 1:
        return {
            "total_outliers": 0,
            "outlier_percentage": 0.0,
            "outlier_indices": [],
            "column_iqr_outliers": {},
            "top_anomalies": [],
        }

    # 1. IQR-based detection
    column_iqr_outliers: Dict[str, Any] = {}
    for col in numeric_df.columns:
        s = numeric_df[col]
        q25 = s.quantile(0.25)
        q75 = s.quantile(0.75)
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr

        outliers = s[(s < lower_bound) | (s > upper_bound)]
        if len(outliers) > 0:
            column_iqr_outliers[str(col)] = {
                "outlier_count": int(len(outliers)),
                "lower_bound": round(float(lower_bound), 2),
                "upper_bound": round(float(upper_bound), 2),
                "min_outlier": round(float(outliers.min()), 2),
                "max_outlier": round(float(outliers.max()), 2),
            }

    # 2. Multivariate Isolation Forest
    try:
        iso = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        preds = iso.fit_predict(numeric_df)
        anomaly_scores = iso.decision_function(numeric_df)

        outlier_mask = preds == -1
        outlier_indices = list(numeric_df.index[outlier_mask])
        total_outliers = len(outlier_indices)
        outlier_pct = (total_outliers / total_rows) * 100

        # Extract top anomalies with most extreme anomaly scores
        numeric_df_outliers = numeric_df.loc[outlier_indices].copy()
        numeric_df_outliers["_score"] = anomaly_scores[outlier_mask]
        numeric_df_outliers = numeric_df_outliers.sort_values(by="_score", ascending=True)

        top_anomalies = []
        for idx, row in numeric_df_outliers.head(5).iterrows():
            row_dict = df.loc[idx].to_dict()
            clean_row = {
                k: (int(v) if isinstance(v, (np.integer, int)) else float(v) if isinstance(v, (np.floating, float)) else str(v))
                for k, v in row_dict.items()
                if not pd.isna(v)
            }
            top_anomalies.append({
                "index": int(idx),
                "anomaly_score": round(float(row["_score"]), 4),
                "record": clean_row,
                "reason": "Multivariate feature combination deviates substantially from central cluster density."
            })

    except Exception:
        outlier_indices = []
        total_outliers = 0
        outlier_pct = 0.0
        top_anomalies = []

    report = OutlierReport(
        total_outliers=total_outliers,
        outlier_percentage=outlier_pct,
        outlier_indices=outlier_indices,
        column_iqr_outliers=column_iqr_outliers,
        top_anomalies=top_anomalies,
    )
    return report.to_dict()
