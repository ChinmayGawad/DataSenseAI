"""
Change Detector:
Detects and scores significant metric shifts over time or between data partitions.
Uses multi-signal significance scoring: Magnitude * Stability * Statistical Confidence * Impact.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from scipy import stats


HIGH_IMPACT_KEYWORDS = [
    "revenue", "sales", "profit", "margin", "cost", "conversion", "churn",
    "admissions", "mrr", "arr", "cancellation", "return", "growth", "loss"
]


class MetricChange:
    def __init__(
        self,
        metric: str,
        baseline_value: float,
        current_value: float,
        delta_abs: float,
        delta_pct: float,
        p_value: float,
        statistical_confidence: float,
        stability_score: float,
        impact_weight: float,
        significance_score: float,
        baseline_period_label: str,
        current_period_label: str,
        baseline_sample_size: int,
        current_sample_size: int,
    ):
        self.metric = metric
        self.baseline_value = baseline_value
        self.current_value = current_value
        self.delta_abs = delta_abs
        self.delta_pct = delta_pct
        self.p_value = p_value
        self.statistical_confidence = statistical_confidence
        self.stability_score = stability_score
        self.impact_weight = impact_weight
        self.significance_score = significance_score
        self.baseline_period_label = baseline_period_label
        self.current_period_label = current_period_label
        self.baseline_sample_size = baseline_sample_size
        self.current_sample_size = current_sample_size

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric": self.metric,
            "baseline_value": round(self.baseline_value, 4),
            "current_value": round(self.current_value, 4),
            "delta_abs": round(self.delta_abs, 4),
            "delta_pct": round(self.delta_pct, 2),
            "p_value": round(self.p_value, 5),
            "statistical_confidence": round(self.statistical_confidence, 2),
            "stability_score": round(self.stability_score, 2),
            "impact_weight": round(self.impact_weight, 2),
            "significance_score": round(self.significance_score, 1),
            "baseline_period_label": self.baseline_period_label,
            "current_period_label": self.current_period_label,
            "baseline_sample_size": self.baseline_sample_size,
            "current_sample_size": self.current_sample_size,
        }


def partition_dataframe_by_time(
    df: pd.DataFrame,
    time_col: Optional[str] = None
) -> Tuple[pd.DataFrame, pd.DataFrame, str, str]:
    """
    Partitions dataframe into baseline and current periods based on datetime or midpoint split.
    """
    total_len = len(df)
    if total_len < 2:
        return df, df, "Baseline", "Current"

    if time_col and time_col in df.columns:
        try:
            parsed_time = pd.to_datetime(df[time_col], errors="coerce", format="mixed")
            valid_time_df = df[parsed_time.notna()].copy()
            valid_time_df["_parsed_time"] = parsed_time[parsed_time.notna()]
            valid_time_df = valid_time_df.sort_values(by="_parsed_time")

            if len(valid_time_df) >= 4:
                # Split at 50% midpoint
                split_idx = len(valid_time_df) // 2
                baseline_df = valid_time_df.iloc[:split_idx].copy()
                current_df = valid_time_df.iloc[split_idx:].copy()

                t_min = baseline_df["_parsed_time"].min().strftime("%Y-%m-%d")
                t_mid = baseline_df["_parsed_time"].max().strftime("%Y-%m-%d")
                t_max = current_df["_parsed_time"].max().strftime("%Y-%m-%d")

                label_base = f"Period 1 ({t_min} to {t_mid})"
                label_curr = f"Period 2 ({t_mid} to {t_max})"

                return (
                    baseline_df.drop(columns=["_parsed_time"]),
                    current_df.drop(columns=["_parsed_time"]),
                    label_base,
                    label_curr
                )
        except Exception:
            pass

    # Chronological index midpoint split
    midpoint = total_len // 2
    baseline_df = df.iloc[:midpoint].copy()
    current_df = df.iloc[midpoint:].copy()
    return baseline_df, current_df, "Baseline Period (First Half)", "Current Period (Second Half)"


def calculate_change_significance(
    metric: str,
    baseline_series: pd.Series,
    current_series: pd.Series,
    baseline_label: str = "Baseline",
    current_label: str = "Current"
) -> MetricChange:
    """
    Computes delta and multi-signal significance score for a numeric metric:
    Change Score = Magnitude * Stability * Statistical Confidence * Impact
    """
    clean_base = baseline_series.dropna()
    clean_curr = current_series.dropna()

    n_base = len(clean_base)
    n_curr = len(clean_curr)

    if n_base == 0 or n_curr == 0:
        return MetricChange(
            metric=metric, baseline_value=0.0, current_value=0.0, delta_abs=0.0,
            delta_pct=0.0, p_value=1.0, statistical_confidence=0.0, stability_score=0.0,
            impact_weight=0.5, significance_score=0.0, baseline_period_label=baseline_label,
            current_period_label=current_label, baseline_sample_size=n_base, current_sample_size=n_curr
        )

    # Use sum for aggregatable flow metrics, mean for rates
    is_rate_metric = any(kw in metric.lower() for kw in ["rate", "ratio", "pct", "percentage", "score", "rating"])
    if is_rate_metric:
        base_val = float(clean_base.mean())
        curr_val = float(clean_curr.mean())
    else:
        # Scale baseline sum if sample counts differ significantly to compare equivalent rates
        base_val = float(clean_base.sum())
        curr_val = float(clean_curr.sum())
        if n_base != n_curr and n_base > 0:
            scale_factor = n_curr / n_base
            base_val = base_val * scale_factor

    delta_abs = curr_val - base_val
    delta_pct = (delta_abs / max(abs(base_val), 1e-6)) * 100.0

    # 1. Magnitude Score (0 to 1.0)
    magnitude_score = min(1.0, abs(delta_pct) / 50.0)

    # 2. Statistical Confidence (1 - p_value)
    p_val = 1.0
    if n_base >= 2 and n_curr >= 2:
        try:
            # Check normality and use t-test or Mann-Whitney U
            _, p_base_norm = stats.shapiro(clean_base[:100]) if len(clean_base) >= 3 else (None, 0.05)
            if p_base_norm is not None and p_base_norm > 0.05:
                stat, p_val = stats.ttest_ind(clean_curr, clean_base, equal_var=False)
            else:
                stat, p_val = stats.mannwhitneyu(clean_curr, clean_base, alternative="two-sided")
        except Exception:
            p_val = 0.5

    p_val = 1.0 if np.isnan(p_val) else float(p_val)
    stat_confidence = max(0.0, min(1.0, 1.0 - p_val))

    # 3. Stability Score (inverse of CV)
    std_all = float(pd.concat([clean_base, clean_curr]).std())
    mean_all = float(pd.concat([clean_base, clean_curr]).mean())
    cv = abs(std_all / max(abs(mean_all), 1e-6))
    stability_score = max(0.1, min(1.0, 1.0 / (1.0 + cv)))

    # 4. Impact Weight (domain relevance)
    metric_lower = metric.lower()
    if any(kw in metric_lower for kw in HIGH_IMPACT_KEYWORDS):
        impact_weight = 1.0
    else:
        impact_weight = 0.7

    # Composite Significance Score (0 to 100)
    # Give significant weight to magnitude and statistical confidence
    raw_score = (
        (0.40 * magnitude_score) +
        (0.30 * stat_confidence) +
        (0.15 * stability_score) +
        (0.15 * impact_weight)
    ) * 100.0

    # Boost if high absolute delta and high confidence
    if abs(delta_pct) >= 15.0 and stat_confidence >= 0.90:
        raw_score = max(raw_score, 80.0)

    significance_score = max(5.0, min(99.0, raw_score))

    return MetricChange(
        metric=metric,
        baseline_value=base_val,
        current_value=curr_val,
        delta_abs=delta_abs,
        delta_pct=delta_pct,
        p_value=p_val,
        statistical_confidence=stat_confidence * 100.0,
        stability_score=stability_score * 100.0,
        impact_weight=impact_weight,
        significance_score=significance_score,
        baseline_period_label=baseline_label,
        current_period_label=current_label,
        baseline_sample_size=n_base,
        current_sample_size=n_curr
    )


def detect_all_metric_changes(
    df: pd.DataFrame,
    metric_columns: List[str],
    time_column: Optional[str] = None
) -> List[MetricChange]:
    """
    Detects and ranks significant changes across all numeric metrics in the dataset.
    """
    baseline_df, current_df, base_label, curr_label = partition_dataframe_by_time(df, time_column)

    changes: List[MetricChange] = []
    for metric in metric_columns:
        if metric in df.columns:
            change = calculate_change_significance(
                metric=metric,
                baseline_series=baseline_df[metric],
                current_series=current_df[metric],
                baseline_label=base_label,
                current_label=curr_label
            )
            changes.append(change)

    # Sort descending by significance score
    changes.sort(key=lambda x: x.significance_score, reverse=True)
    return changes
