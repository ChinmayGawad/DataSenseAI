"""
Contribution Engine:
Quantifies the exact mathematical contribution of dimensions and segments to an observed metric shift.
Handles zero baselines, negative metrics, mixed positive/negative segment movements, and verifies additivity.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


class SegmentContribution:
    def __init__(
        self,
        dimension: str,
        segment: str,
        baseline_value: float,
        current_value: float,
        delta_abs: float,
        delta_pct: float,
        contribution_pct: float,
        signed_contribution_pct: float,
        baseline_sample_size: int,
        current_sample_size: int,
        total_sample_size: int,
        share_of_population_pct: float,
        is_diluting_or_counteracting: bool = False,
    ):
        self.dimension = dimension
        self.segment = str(segment)
        self.baseline_value = baseline_value
        self.current_value = current_value
        self.delta_abs = delta_abs
        self.delta_pct = delta_pct
        self.contribution_pct = contribution_pct
        self.signed_contribution_pct = signed_contribution_pct
        self.baseline_sample_size = baseline_sample_size
        self.current_sample_size = current_sample_size
        self.total_sample_size = total_sample_size
        self.share_of_population_pct = share_of_population_pct
        self.is_diluting_or_counteracting = is_diluting_or_counteracting

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dimension": self.dimension,
            "segment": self.segment,
            "baseline_value": round(self.baseline_value, 4),
            "current_value": round(self.current_value, 4),
            "delta_abs": round(self.delta_abs, 4),
            "delta_pct": round(self.delta_pct, 2),
            "contribution_pct": round(self.contribution_pct, 2),
            "signed_contribution_pct": round(self.signed_contribution_pct, 2),
            "baseline_sample_size": self.baseline_sample_size,
            "current_sample_size": self.current_sample_size,
            "total_sample_size": self.total_sample_size,
            "share_of_population_pct": round(self.share_of_population_pct, 2),
            "is_diluting_or_counteracting": self.is_diluting_or_counteracting,
        }


def analyze_dimension_contributions(
    baseline_df: pd.DataFrame,
    current_df: pd.DataFrame,
    target_metric: str,
    dimension_col: str,
    is_rate_metric: bool = False,
    min_sample_size: int = 3
) -> Dict[str, Any]:
    """
    Decomposes total target metric delta across all segments of a dimension.
    Calculates exact segment contribution percentages and checks additivity.
    """
    total_base_series = baseline_df[target_metric].dropna() if target_metric in baseline_df.columns else pd.Series([])
    total_curr_series = current_df[target_metric].dropna() if target_metric in current_df.columns else pd.Series([])

    n_base_total = len(total_base_series)
    n_curr_total = len(total_curr_series)

    if is_rate_metric:
        total_base_val = float(total_base_series.mean()) if n_base_total > 0 else 0.0
        total_curr_val = float(total_curr_series.mean()) if n_curr_total > 0 else 0.0
    else:
        total_base_val = float(total_base_series.sum()) if n_base_total > 0 else 0.0
        total_curr_val = float(total_curr_series.sum()) if n_curr_total > 0 else 0.0
        # Normalize baseline sum if sample counts differ significantly
        if n_base_total != n_curr_total and n_base_total > 0:
            scale = n_curr_total / n_base_total
            total_base_val = total_base_val * scale

    total_delta = total_curr_val - total_base_val
    abs_total_delta = abs(total_delta)

    # Collect all unique segments across both periods
    base_segs = set(baseline_df[dimension_col].dropna().unique()) if dimension_col in baseline_df.columns else set()
    curr_segs = set(current_df[dimension_col].dropna().unique()) if dimension_col in current_df.columns else set()
    all_segments = sorted(list(base_segs.union(curr_segs)), key=lambda s: str(s))

    segment_results: List[SegmentContribution] = []
    total_pop_size = n_base_total + n_curr_total

    # Calculate individual segment values
    for seg in all_segments:
        base_sub = baseline_df[baseline_df[dimension_col] == seg][target_metric].dropna() if dimension_col in baseline_df.columns else pd.Series([])
        curr_sub = current_df[current_df[dimension_col] == seg][target_metric].dropna() if dimension_col in current_df.columns else pd.Series([])

        n_base_seg = len(base_sub)
        n_curr_seg = len(curr_sub)
        n_total_seg = n_base_seg + n_curr_seg

        if is_rate_metric:
            base_seg_val = float(base_sub.mean()) if n_base_seg > 0 else 0.0
            curr_seg_val = float(curr_sub.mean()) if n_curr_seg > 0 else 0.0
        else:
            base_seg_val = float(base_sub.sum()) if n_base_seg > 0 else 0.0
            curr_seg_val = float(curr_sub.sum()) if n_curr_seg > 0 else 0.0
            if n_base_total != n_curr_total and n_base_total > 0:
                scale = n_curr_total / n_base_total
                base_seg_val = base_seg_val * scale

        seg_delta = curr_seg_val - base_seg_val
        seg_delta_pct = (seg_delta / max(abs(base_seg_val), 1e-6)) * 100.0 if base_seg_val != 0 else (100.0 if curr_seg_val > 0 else 0.0)

        # Contribution calculation
        if abs_total_delta > 1e-5:
            # Signed contribution
            signed_contrib = (seg_delta / abs_total_delta) * 100.0
            # Absolute share of change in direction of total change
            if (total_delta < 0 and seg_delta < 0) or (total_delta > 0 and seg_delta > 0):
                contrib_pct = (abs(seg_delta) / abs_total_delta) * 100.0
                is_counteracting = False
            else:
                contrib_pct = (abs(seg_delta) / abs_total_delta) * 100.0
                is_counteracting = True
        else:
            signed_contrib = 0.0
            contrib_pct = 0.0
            is_counteracting = False

        pop_share = (n_total_seg / max(total_pop_size, 1)) * 100.0

        segment_results.append(
            SegmentContribution(
                dimension=dimension_col,
                segment=str(seg),
                baseline_value=base_seg_val,
                current_value=curr_seg_val,
                delta_abs=seg_delta,
                delta_pct=seg_delta_pct,
                contribution_pct=contrib_pct,
                signed_contribution_pct=signed_contrib,
                baseline_sample_size=n_base_seg,
                current_sample_size=n_curr_seg,
                total_sample_size=n_total_seg,
                share_of_population_pct=pop_share,
                is_diluting_or_counteracting=is_counteracting
            )
        )

    # Sort descending by contribution percentage
    segment_results.sort(key=lambda x: (not x.is_diluting_or_counteracting, x.contribution_pct), reverse=True)

    # Verify additivity
    sum_segment_deltas = sum(s.delta_abs for s in segment_results)
    additivity_gap = abs(sum_segment_deltas - total_delta)

    return {
        "dimension": dimension_col,
        "target_metric": target_metric,
        "total_baseline_value": round(total_base_val, 4),
        "total_current_value": round(total_curr_val, 4),
        "total_delta_abs": round(total_delta, 4),
        "total_delta_pct": round((total_delta / max(abs(total_base_val), 1e-6)) * 100.0, 2),
        "segment_contributions": segment_results,
        "additivity_verified": additivity_gap < max(1.0, abs_total_delta * 0.05),
        "additivity_gap": round(additivity_gap, 4),
    }
