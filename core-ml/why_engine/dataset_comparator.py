"""
Dataset Comparator:
Compares two distinct datasets or time horizons (Dataset A vs Dataset B / 'What Changed Since Last Upload?').
Automatically aligns schemas, calculates metric-level deltas, and extracts top divergent drivers.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


def compare_two_datasets(
    df_a: pd.DataFrame,
    df_b: pd.DataFrame,
    label_a: str = "Dataset A (Baseline)",
    label_b: str = "Dataset B (Current)",
    target_metric: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compares two datasets to discover what changed across metrics and dimensions.
    """
    # Overlapping columns
    cols_a = set(df_a.columns)
    cols_b = set(df_b.columns)
    common_cols = sorted(list(cols_a.intersection(cols_b)))

    numeric_common = [c for c in common_cols if pd.api.types.is_numeric_dtype(df_a[c]) and pd.api.types.is_numeric_dtype(df_b[c])]
    categorical_common = [c for c in common_cols if c not in numeric_common]

    metric_comparisons: List[Dict[str, Any]] = []

    for metric in numeric_common:
        s_a = df_a[metric].dropna()
        s_b = df_b[metric].dropna()

        if len(s_a) == 0 or len(s_b) == 0:
            continue

        mean_a = float(s_a.mean())
        mean_b = float(s_b.mean())
        sum_a = float(s_a.sum())
        sum_b = float(s_b.sum())

        delta_sum = sum_b - sum_a
        delta_pct = (delta_sum / max(abs(sum_a), 1e-6)) * 100.0

        # Sub-dimension driver breakdown if target metric
        top_divergences = []
        for cat_dim in categorical_common[:3]:
            try:
                base_grp = df_a.groupby(cat_dim)[metric].sum()
                curr_grp = df_b.groupby(cat_dim)[metric].sum()
                aligned_grp = pd.concat([base_grp, curr_grp], axis=1, keys=["base", "curr"]).fillna(0)
                aligned_grp["diff"] = aligned_grp["curr"] - aligned_grp["base"]
                aligned_grp["diff_pct"] = (aligned_grp["diff"] / aligned_grp["base"].replace(0, np.nan)) * 100.0

                top_shift = aligned_grp.sort_values(by="diff", ascending=False).head(1)
                if not top_shift.empty:
                    seg_name = str(top_shift.index[0])
                    seg_delta = float(top_shift["diff"].iloc[0])
                    seg_pct = float(top_shift["diff_pct"].iloc[0]) if not pd.isna(top_shift["diff_pct"].iloc[0]) else 0.0
                    top_divergences.append({
                        "dimension": cat_dim,
                        "segment": seg_name,
                        "delta_abs": round(seg_delta, 2),
                        "delta_pct": round(seg_pct, 1)
                    })
            except Exception:
                pass

        metric_comparisons.append({
            "metric": metric,
            "mean_a": round(mean_a, 2),
            "mean_b": round(mean_b, 2),
            "sum_a": round(sum_a, 2),
            "sum_b": round(sum_b, 2),
            "delta_abs": round(delta_sum, 2),
            "delta_pct": round(delta_pct, 2),
            "direction": "up" if delta_sum > 0 else ("down" if delta_sum < 0 else "neutral"),
            "top_divergent_segments": top_divergences
        })

    # Sort descending by absolute percentage change
    metric_comparisons.sort(key=lambda x: abs(x["delta_pct"]), reverse=True)

    summary_headline = (
        f"Comparison between {label_a} ({len(df_a):,} rows) and {label_b} ({len(df_b):,} rows) "
        f"identified {len(metric_comparisons)} shared metrics."
    )

    return {
        "status": "success",
        "label_a": label_a,
        "label_b": label_b,
        "row_count_a": len(df_a),
        "row_count_b": len(df_b),
        "shared_columns_count": len(common_cols),
        "metric_comparisons": metric_comparisons,
        "summary_headline": summary_headline,
    }
