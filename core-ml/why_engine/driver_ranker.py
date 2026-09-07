"""
Driver Ranking & Classification Engine:
Scores candidate drivers across multiple dimensions and ranks them into ontological roles.
Driver Score = f(Contribution, Statistical Confidence, Effect Size, Sample Reliability, Data Quality).
"""

from typing import Dict, Any, List, Optional
import numpy as np


class RankedDriver:
    def __init__(
        self,
        dimension: str,
        segment: str,
        delta_abs: float,
        delta_pct: float,
        contribution_pct: float,
        statistical_confidence: float,
        effect_size: float,
        sample_size: int,
        sample_size_reliability: float,
        data_quality_score: float,
        composite_score: float,
        classification: str,
        statistical_summary: str,
        evidence_points: List[str],
        subset_filter: Optional[Dict[str, Any]] = None,
        is_diluting: bool = False,
    ):
        self.dimension = dimension
        self.segment = str(segment)
        self.delta_abs = delta_abs
        self.delta_pct = delta_pct
        self.contribution_pct = contribution_pct
        self.statistical_confidence = statistical_confidence
        self.effect_size = effect_size
        self.sample_size = sample_size
        self.sample_size_reliability = sample_size_reliability
        self.data_quality_score = data_quality_score
        self.composite_score = composite_score
        self.classification = classification
        self.statistical_summary = statistical_summary
        self.evidence_points = evidence_points
        self.subset_filter = subset_filter or {dimension: segment}
        self.is_diluting = is_diluting

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dimension": self.dimension,
            "segment": self.segment,
            "delta_abs": round(self.delta_abs, 4),
            "delta_pct": round(self.delta_pct, 2),
            "contribution_pct": round(self.contribution_pct, 2),
            "statistical_confidence": round(self.statistical_confidence, 2),
            "effect_size": round(self.effect_size, 4),
            "sample_size": self.sample_size,
            "composite_score": round(self.composite_score, 1),
            "classification": self.classification,
            "statistical_summary": self.statistical_summary,
            "evidence_points": self.evidence_points,
            "subset_filter": self.subset_filter,
            "is_diluting": self.is_diluting,
        }


def calculate_sample_reliability(sample_size: int, total_dataset_size: int) -> float:
    """
    Data-size-aware sample reliability score (0.0 to 1.0).
    Penalizes tiny segments (< 10 records) to prevent false discoveries.
    """
    if sample_size < 5:
        return 0.1
    elif sample_size < 15:
        return 0.4
    elif sample_size < 30:
        return 0.7
    elif sample_size < 100:
        return 0.9
    return 1.0


def score_and_classify_driver(
    dimension: str,
    segment: str,
    delta_abs: float,
    delta_pct: float,
    contribution_pct: float,
    p_value: float,
    effect_size: float,
    sample_size: int,
    total_dataset_size: int,
    data_quality_score: float = 90.0,
    is_diluting: bool = False,
    unit_symbol: str = ""
) -> RankedDriver:
    """
    Calculates composite driver score (0-100) and assigns formal classification.
    """
    # 1. Normalized Contribution (0 to 1.0)
    norm_contrib = min(1.0, max(0.0, contribution_pct / 100.0))

    # 2. Statistical Confidence (1 - p_value)
    stat_conf = max(0.0, min(1.0, 1.0 - (p_value if not np.isnan(p_value) else 1.0)))

    # 3. Normalized Effect Size (Cohen's d or eta-squared normalized)
    norm_effect = min(1.0, max(0.0, abs(effect_size) / 1.5))

    # 4. Sample Size Reliability
    sample_rel = calculate_sample_reliability(sample_size, total_dataset_size)

    # 5. Normalized Data Quality
    norm_quality = min(1.0, max(0.1, data_quality_score / 100.0))

    # Composite Driver Score (0-100)
    composite = (
        (0.35 * norm_contrib) +
        (0.25 * stat_conf) +
        (0.20 * norm_effect) +
        (0.10 * sample_rel) +
        (0.10 * norm_quality)
    ) * 100.0

    if is_diluting:
        composite = composite * 0.4

    # Classification Rules
    if sample_size < 8 or sample_rel < 0.3:
        classification = "INSUFFICIENT_EVIDENCE"
    elif composite >= 70.0 and contribution_pct >= 25.0 and stat_conf >= 0.90:
        classification = "PRIMARY_DRIVER"
    elif composite >= 45.0 and contribution_pct >= 10.0:
        classification = "SECONDARY_DRIVER"
    elif stat_conf >= 0.85 and contribution_pct >= 5.0:
        classification = "SUPPORTING_FACTOR"
    elif stat_conf >= 0.70:
        classification = "ASSOCIATED_FACTOR"
    else:
        classification = "POSSIBLE_EXPLANATION"

    # Format Evidence Points
    dir_str = "fell" if delta_abs < 0 else "rose"
    evidence = [
        f"Segment '{segment}' in dimension '{dimension}' {dir_str} by {abs(delta_pct):.1f}% ({unit_symbol}{abs(delta_abs):,.2f}).",
        f"Accounts for {contribution_pct:.1f}% of the total target shift.",
        f"Observed across {sample_size:,} records (Confidence: {stat_conf * 100:.0f}%, p = {p_value:.4f})."
    ]

    stat_summary = f"{classification.replace('_', ' ').title()} (Score: {composite:.0f}/100, Contrib: {contribution_pct:.1f}%, p = {p_value:.4f})"

    return RankedDriver(
        dimension=dimension,
        segment=str(segment),
        delta_abs=delta_abs,
        delta_pct=delta_pct,
        contribution_pct=contribution_pct,
        statistical_confidence=stat_conf * 100.0,
        effect_size=effect_size,
        sample_size=sample_size,
        sample_size_reliability=sample_rel * 100.0,
        data_quality_score=data_quality_score,
        composite_score=composite,
        classification=classification,
        statistical_summary=stat_summary,
        evidence_points=evidence,
        is_diluting=is_diluting
    )


def rank_candidate_drivers(drivers: List[RankedDriver]) -> List[RankedDriver]:
    """
    Ranks drivers descending by composite score, prioritizing primary contributors.
    """
    return sorted(drivers, key=lambda d: (d.classification == "PRIMARY_DRIVER", d.composite_score), reverse=True)
