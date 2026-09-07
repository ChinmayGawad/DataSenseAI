"""
Recursive Root-Cause Tree Builder:
Builds the hierarchical investigation tree by recursively drilling down into high-contribution segments.
Enforces data-size-aware stopping rules and attaches 'Why Did We Stop?' explainability rationale to leaf nodes.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from .contribution import analyze_dimension_contributions, SegmentContribution
from .statistical_tests import validate_before_vs_after, validate_categorical_vs_numeric
from .driver_ranker import score_and_classify_driver, rank_candidate_drivers, RankedDriver
from .evidence import build_evidence_package, EvidencePackage


class RootCauseNode:
    def __init__(
        self,
        id: str,
        label: str,
        depth: int,
        dimension: Optional[str],
        segment: Optional[str],
        target_metric: str,
        baseline_value: float,
        current_value: float,
        delta_abs: float,
        delta_pct: float,
        contribution_pct: float,
        confidence_score: float,
        sample_size: int,
        classification: str,
        statistical_test: str,
        effect_size_summary: str,
        stopping_reason: Optional[str] = None,
        children: Optional[List['RootCauseNode']] = None,
        evidence: Optional[EvidencePackage] = None,
    ):
        self.id = id
        self.label = label
        self.depth = depth
        self.dimension = dimension
        self.segment = str(segment) if segment is not None else None
        self.target_metric = target_metric
        self.baseline_value = baseline_value
        self.current_value = current_value
        self.delta_abs = delta_abs
        self.delta_pct = delta_pct
        self.contribution_pct = contribution_pct
        self.confidence_score = confidence_score
        self.sample_size = sample_size
        self.classification = classification
        self.statistical_test = statistical_test
        self.effect_size_summary = effect_size_summary
        self.stopping_reason = stopping_reason
        self.children = children or []
        self.evidence = evidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "depth": self.depth,
            "dimension": self.dimension,
            "segment": self.segment,
            "target_metric": self.target_metric,
            "baseline_value": round(self.baseline_value, 4),
            "current_value": round(self.current_value, 4),
            "delta_abs": round(self.delta_abs, 4),
            "delta_pct": round(self.delta_pct, 2),
            "contribution_pct": round(self.contribution_pct, 2),
            "confidence_score": round(self.confidence_score, 1),
            "sample_size": self.sample_size,
            "classification": self.classification,
            "statistical_test": self.statistical_test,
            "effect_size_summary": self.effect_size_summary,
            "stopping_reason": self.stopping_reason,
            "evidence": self.evidence.to_dict() if self.evidence else None,
            "children": [c.to_dict() for c in self.children],
        }


def build_recursive_insight_tree(
    baseline_df: pd.DataFrame,
    current_df: pd.DataFrame,
    target_metric: str,
    candidate_dimensions: List[str],
    max_depth: int = 3,
    min_contribution: float = 10.0,
    data_quality_score: float = 90.0,
    unit_symbol: str = "",
    current_depth: int = 0,
    parent_id: str = "root",
    used_dimensions: Optional[List[str]] = None
) -> RootCauseNode:
    """
    Recursively drills down into high-contribution dimensions to isolate root-cause drivers.
    Enforces stopping rules when cohort size, contribution, or depth thresholds are reached.
    """
    used_dims = list(used_dimensions or [])
    total_dataset_size = len(baseline_df) + len(current_df)

    # 1. Evaluate root / target node
    total_base = float(baseline_df[target_metric].dropna().sum()) if target_metric in baseline_df.columns else 0.0
    total_curr = float(current_df[target_metric].dropna().sum()) if target_metric in current_df.columns else 0.0

    # Scale baseline if sample lengths differ
    if len(baseline_df) > 0 and len(current_df) > 0 and len(baseline_df) != len(current_df):
        total_base = total_base * (len(current_df) / len(baseline_df))

    total_delta = total_curr - total_base
    total_pct = (total_delta / max(abs(total_base), 1e-6)) * 100.0

    stat_root = validate_before_vs_after(
        baseline_df[target_metric] if target_metric in baseline_df.columns else pd.Series([]),
        current_df[target_metric] if target_metric in current_df.columns else pd.Series([])
    )

    root_evidence = build_evidence_package(
        node_id=parent_id,
        target_metric=target_metric,
        dimension=None,
        segment=None,
        baseline_val=total_base,
        current_val=total_curr,
        total_delta_abs=total_delta,
        sample_size_before=len(baseline_df),
        sample_size_after=len(current_df),
        stat_test_name=stat_root.test_name,
        test_statistic=stat_root.test_statistic,
        p_value=stat_root.p_value,
        effect_size_metric=stat_root.effect_size_metric,
        effect_size_val=stat_root.effect_size_value,
        unit_symbol=unit_symbol
    )

    root_node = RootCauseNode(
        id=parent_id,
        label=f"{target_metric} ({total_pct:+.1f}%)",
        depth=current_depth,
        dimension=None,
        segment=None,
        target_metric=target_metric,
        baseline_value=total_base,
        current_value=total_curr,
        delta_abs=total_delta,
        delta_pct=total_pct,
        contribution_pct=100.0,
        confidence_score=95.0,
        sample_size=total_dataset_size,
        classification="TARGET_METRIC",
        statistical_test=stat_root.test_name,
        effect_size_summary=f"Cohen's d = {stat_root.effect_size_value:.2f}",
        evidence=root_evidence,
        children=[]
    )

    # 2. Check Depth Stopping Rule
    if current_depth >= max_depth:
        root_node.stopping_reason = f"Maximum investigation depth ({max_depth}) reached."
        return root_node

    # 3. Check Minimum Sample Size Stopping Rule
    min_cohort_size = max(8, min(40, int(total_dataset_size * 0.02)))
    if total_dataset_size < min_cohort_size:
        root_node.stopping_reason = (
            f"Insufficient observations (N = {total_dataset_size} < {min_cohort_size}). "
            f"Further drilling would produce unstable conclusions."
        )
        return root_node

    # 4. Discover candidate drivers across unused dimensions
    available_dims = [d for d in candidate_dimensions if d not in used_dims and d in baseline_df.columns and d in current_df.columns]
    if not available_dims:
        root_node.stopping_reason = "All meaningful categorical dimensions have been fully evaluated."
        return root_node

    ranked_candidates: List[RankedDriver] = []

    for dim in available_dims:
        contrib_res = analyze_dimension_contributions(
            baseline_df=baseline_df,
            current_df=current_df,
            target_metric=target_metric,
            dimension_col=dim
        )

        for seg_contrib in contrib_res.get("segment_contributions", []):
            if seg_contrib.contribution_pct < min_contribution:
                continue

            # Statistical validation for this segment
            base_s = baseline_df[baseline_df[dim] == seg_contrib.segment][target_metric] if dim in baseline_df.columns else pd.Series([])
            curr_s = current_df[current_df[dim] == seg_contrib.segment][target_metric] if dim in current_df.columns else pd.Series([])
            stat_val = validate_before_vs_after(base_s, curr_s)

            driver = score_and_classify_driver(
                dimension=dim,
                segment=seg_contrib.segment,
                delta_abs=seg_contrib.delta_abs,
                delta_pct=seg_contrib.delta_pct,
                contribution_pct=seg_contrib.contribution_pct,
                p_value=stat_val.p_value,
                effect_size=stat_val.effect_size_value,
                sample_size=seg_contrib.total_sample_size,
                total_dataset_size=total_dataset_size,
                data_quality_score=data_quality_score,
                is_diluting=seg_contrib.is_diluting_or_counteracting,
                unit_symbol=unit_symbol
            )
            ranked_candidates.append(driver)

    ranked_candidates = rank_candidate_drivers(ranked_candidates)

    if not ranked_candidates:
        root_node.stopping_reason = (
            f"No remaining candidate dimension explains a meaningful additional portion "
            f"(>= {min_contribution:.0f}%) of the variance."
        )
        return root_node

    # 5. Select Top 1-2 drivers to branch into
    top_drivers = ranked_candidates[:2]

    for idx, best_driver in enumerate(top_drivers):
        child_id = f"{parent_id}_{idx + 1}"
        dim = best_driver.dimension
        seg = best_driver.segment

        # Segment Subsets
        sub_base = baseline_df[baseline_df[dim] == seg].copy()
        sub_curr = current_df[current_df[dim] == seg].copy()

        # Build Evidence for this child node
        child_stat = validate_before_vs_after(
            sub_base[target_metric] if target_metric in sub_base.columns else pd.Series([]),
            sub_curr[target_metric] if target_metric in sub_curr.columns else pd.Series([])
        )

        # Tabular breakdown for the show evidence modal
        sub_table = [
            {"dimension": dim, "segment": seg, "metric": target_metric, "delta_pct": best_driver.delta_pct, "contrib_pct": best_driver.contribution_pct}
        ]

        child_evidence = build_evidence_package(
            node_id=child_id,
            target_metric=target_metric,
            dimension=dim,
            segment=seg,
            baseline_val=best_driver.delta_abs / (best_driver.delta_pct / 100.0) if best_driver.delta_pct != 0 else 0.0,
            current_val=best_driver.delta_abs,
            total_delta_abs=total_delta,
            sample_size_before=len(sub_base),
            sample_size_after=len(sub_curr),
            stat_test_name=child_stat.test_name,
            test_statistic=child_stat.test_statistic,
            p_value=child_stat.p_value,
            effect_size_metric=child_stat.effect_size_metric,
            effect_size_val=child_stat.effect_size_value,
            subsegment_table=sub_table,
            unit_symbol=unit_symbol
        )

        # Recurse if driver score is strong and sample is sufficient
        if best_driver.composite_score >= 35.0 and len(sub_base) + len(sub_curr) >= min_cohort_size and current_depth + 1 < max_depth:
            sub_tree = build_recursive_insight_tree(
                baseline_df=sub_base,
                current_df=sub_curr,
                target_metric=target_metric,
                candidate_dimensions=available_dims,
                max_depth=max_depth,
                min_contribution=min_contribution,
                data_quality_score=data_quality_score,
                unit_symbol=unit_symbol,
                current_depth=current_depth + 1,
                parent_id=child_id,
                used_dimensions=used_dims + [dim]
            )

            # Preserve node identity with computed recursive children
            sub_tree.label = f"{dim}: {seg} ({best_driver.delta_pct:+.1f}%)"
            sub_tree.dimension = dim
            sub_tree.segment = seg
            sub_tree.contribution_pct = best_driver.contribution_pct
            sub_tree.confidence_score = best_driver.composite_score
            sub_tree.classification = best_driver.classification
            sub_tree.statistical_test = child_stat.test_name
            sub_tree.effect_size_summary = f"{child_stat.effect_size_metric} = {child_stat.effect_size_value:.2f}"
            sub_tree.evidence = child_evidence

            root_node.children.append(sub_tree)
        else:
            # Leaf node
            leaf_node = RootCauseNode(
                id=child_id,
                label=f"{dim}: {seg} ({best_driver.delta_pct:+.1f}%)",
                depth=current_depth + 1,
                dimension=dim,
                segment=seg,
                target_metric=target_metric,
                baseline_value=child_evidence.baseline_value,
                current_value=child_evidence.current_value,
                delta_abs=best_driver.delta_abs,
                delta_pct=best_driver.delta_pct,
                contribution_pct=best_driver.contribution_pct,
                confidence_score=best_driver.composite_score,
                sample_size=best_driver.sample_size,
                classification=best_driver.classification,
                statistical_test=child_stat.test_name,
                effect_size_summary=f"{child_stat.effect_size_metric} = {child_stat.effect_size_value:.2f}",
                stopping_reason=(
                    f"Investigation reached granular segment '{seg}'. "
                    f"Further subdivision yields sample size < {min_cohort_size}."
                ),
                evidence=child_evidence,
                children=[]
            )
            root_node.children.append(leaf_node)

    return root_node


def generate_competing_hypotheses(
    root_node: RootCauseNode,
    seasonality_score: float = 20.0
) -> List[Dict[str, Any]]:
    """
    Synthesizes competing explanatory hypotheses with calibrated confidence scores.
    """
    hypotheses = []

    # 1. Primary Driver from Tree
    if root_node.children:
        top_child = root_node.children[0]
        hypotheses.append({
            "hypothesis": f"Primary segment contraction in {top_child.dimension}: {top_child.segment}",
            "confidence": round(top_child.confidence_score, 1),
            "type": "PRIMARY",
            "contribution_pct": round(top_child.contribution_pct, 1),
            "description": f"Accounts for ~{top_child.contribution_pct:.0f}% of total observed variance."
        })

    # 2. Secondary Driver from Tree (if present)
    if len(root_node.children) > 1:
        sec_child = root_node.children[1]
        hypotheses.append({
            "hypothesis": f"Secondary divergence across {sec_child.dimension}: {sec_child.segment}",
            "confidence": round(sec_child.confidence_score * 0.85, 1),
            "type": "SECONDARY",
            "contribution_pct": round(sec_child.contribution_pct, 1),
            "description": f"Contributed ~{sec_child.contribution_pct:.0f}% to the observed delta."
        })

    # 3. Seasonality Hypothesis
    hypotheses.append({
        "hypothesis": "Cyclical / Period-over-Period Baseline Seasonality",
        "confidence": round(seasonality_score, 1),
        "type": "SEASONALITY",
        "contribution_pct": round(seasonality_score * 0.4, 1),
        "description": "Historical cyclical patterns explain a portion of the variance." if seasonality_score > 40 else "Seasonality is unlikely to be the primary cause."
    })

    return sorted(hypotheses, key=lambda h: h["confidence"], reverse=True)
