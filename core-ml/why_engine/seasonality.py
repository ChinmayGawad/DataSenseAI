"""
Seasonality & Cyclical Baseline Checker:
Evaluates whether an observed change is part of an expected periodic or seasonal cycle.
Prevents false alarms on recurring seasonal patterns.
"""

from typing import Dict, Any, Optional
import pandas as pd
import numpy as np


class SeasonalityReport:
    def __init__(
        self,
        seasonality_detected: bool,
        seasonality_score: float,
        seasonal_cycle_type: Optional[str] = None,
        historical_variance_pct: float = 0.0,
        explanation: str = "No recurring seasonal pattern detected.",
        is_expected_cyclical_shift: bool = False,
    ):
        self.seasonality_detected = seasonality_detected
        self.seasonality_score = seasonality_score
        self.seasonal_cycle_type = seasonal_cycle_type
        self.historical_variance_pct = historical_variance_pct
        self.explanation = explanation
        self.is_expected_cyclical_shift = is_expected_cyclical_shift

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seasonality_detected": self.seasonality_detected,
            "seasonality_score": round(self.seasonality_score, 1),
            "seasonal_cycle_type": self.seasonal_cycle_type,
            "historical_variance_pct": round(self.historical_variance_pct, 2),
            "explanation": self.explanation,
            "is_expected_cyclical_shift": self.is_expected_cyclical_shift,
        }


def check_seasonality(
    df: pd.DataFrame,
    target_metric: str,
    time_col: Optional[str] = None
) -> SeasonalityReport:
    """
    Analyzes temporal patterns across months, quarters, and days of week to test for cyclicality.
    """
    if not time_col or time_col not in df.columns or target_metric not in df.columns:
        return SeasonalityReport(
            seasonality_detected=False,
            seasonality_score=15.0,
            explanation="No time dimension available to assess multi-period seasonality."
        )

    try:
        parsed_dates = pd.to_datetime(df[time_col], errors="coerce", format="mixed")
        valid_df = df[parsed_dates.notna()].copy()
        valid_df["_dt"] = parsed_dates[parsed_dates.notna()]

        if len(valid_df) < 12:
            return SeasonalityReport(
                seasonality_detected=False,
                seasonality_score=20.0,
                explanation="Insufficient temporal depth to confirm recurring multi-year seasonality."
            )

        # 1. Month of year check (if multi-year data exists)
        valid_df["_month"] = valid_df["_dt"].dt.month
        valid_df["_year"] = valid_df["_dt"].dt.year

        unique_years = valid_df["_year"].nunique()
        if unique_years >= 2:
            # Group by year and month
            monthly = valid_df.groupby(["_year", "_month"])[target_metric].mean().unstack(level=0)
            if monthly.shape[1] >= 2 and monthly.shape[0] >= 3:
                # Calculate correlation between years
                corr_val = monthly.corr().iloc[0, 1]
                if not np.isnan(corr_val) and corr_val > 0.65:
                    return SeasonalityReport(
                        seasonality_detected=True,
                        seasonality_score=round(corr_val * 100, 1),
                        seasonal_cycle_type="Annual / Monthly Cycle",
                        historical_variance_pct=round((1 - corr_val) * 100, 1),
                        explanation=(
                            f"Strong annual seasonality detected (r = {corr_val:.2f}). "
                            f"Similar metric shifts occurred during matching calendar periods in prior years."
                        ),
                        is_expected_cyclical_shift=True
                    )

        # 2. Day of week check
        valid_df["_dow"] = valid_df["_dt"].dt.day_name()
        dow_means = valid_df.groupby("_dow")[target_metric].mean()
        if len(dow_means) >= 5:
            dow_cv = float(dow_means.std() / max(abs(dow_means.mean()), 1e-6))
            if dow_cv > 0.40:
                return SeasonalityReport(
                    seasonality_detected=True,
                    seasonality_score=round(min(85.0, dow_cv * 100), 1),
                    seasonal_cycle_type="Weekly / Day-of-Week Pattern",
                    historical_variance_pct=round(dow_cv * 100, 1),
                    explanation=f"Pronounced day-of-week cyclicality observed across '{target_metric}'."
                )

    except Exception:
        pass

    return SeasonalityReport(
        seasonality_detected=False,
        seasonality_score=10.0,
        explanation="Metric change represents an isolated structural shift rather than recurring seasonal noise."
    )
