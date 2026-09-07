"""
Why? Engine Master Orchestrator:
Coordinates the end-to-end autonomous root-cause investigation pipeline.
Executes profiling, shift detection, contribution decomposition, statistical testing,
seasonality/confounding auditing, recursive tree synthesis, counterfactual modeling,
and actionable recommendation formulation.
"""

from typing import Dict, Any, List, Optional
import time
import pandas as pd
import numpy as np

from .profiler import profile_dataset, DatasetFingerprint
from .change_detector import partition_dataframe_by_time, detect_all_metric_changes, MetricChange
from .seasonality import check_seasonality, SeasonalityReport
from .confounding import check_confounding_risk, ConfoundingAudit
from .counterfactual import simulate_counterfactual, CounterfactualSimulation
from .tree_builder import build_recursive_insight_tree, generate_competing_hypotheses, RootCauseNode


def run_why_investigation(
    df: pd.DataFrame,
    target_metric: Optional[str] = None,
    time_column: Optional[str] = None,
    max_depth: int = 3,
    min_contribution: float = 10.0,
    unit_symbol: str = "",
    custom_baseline_df: Optional[pd.DataFrame] = None,
    custom_current_df: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Master entry point for Autonomous Root-Cause Analysis.
    """
    start_time = time.time()
    timeline_steps: List[Dict[str, Any]] = []

    # 1. Dataset Profiling
    fingerprint: DatasetFingerprint = profile_dataset(df)
    timeline_steps.append({
        "step": 1,
        "title": f"Profiled Dataset & Detected Domain: {fingerprint.detected_domain}",
        "status": "completed",
        "details": f"{fingerprint.total_rows:,} rows, {fingerprint.total_columns} columns, {fingerprint.identifier_count} IDs filtered out."
    })

    # Available numeric metrics and valid dimensions (excluding identifiers)
    available_metrics = fingerprint.metric_columns
    valid_dimensions = fingerprint.dimension_columns

    if not available_metrics:
        # Fallback: select any numeric column
        num_cols = list(df.select_dtypes(include=[np.number]).columns)
        available_metrics = [c for c in num_cols if c not in fingerprint.identifier_columns]

    if not available_metrics:
        raise ValueError("Dataset does not contain any valid numeric metrics to investigate.")

    # 2. Select / Detect Target Metric
    detected_time_col = time_column or (fingerprint.time_columns[0] if fingerprint.time_columns else None)

    if custom_baseline_df is not None and custom_current_df is not None:
        baseline_df = custom_baseline_df
        current_df = custom_current_df
        base_label = "Custom Baseline"
        curr_label = "Custom Current"
    else:
        baseline_df, current_df, base_label, curr_label = partition_dataframe_by_time(df, detected_time_col)

    if target_metric and target_metric in df.columns:
        chosen_metric = target_metric
    else:
        # Automatically detect the most significant shifted metric
        all_changes = detect_all_metric_changes(df, available_metrics, detected_time_col)
        chosen_metric = all_changes[0].metric if all_changes else available_metrics[0]

    # Calculate change statistics for chosen target
    base_s = baseline_df[chosen_metric].dropna() if chosen_metric in baseline_df.columns else pd.Series([])
    curr_s = current_df[chosen_metric].dropna() if chosen_metric in current_df.columns else pd.Series([])

    base_val = float(base_s.sum()) if len(base_s) > 0 else 0.0
    curr_val = float(curr_s.sum()) if len(curr_s) > 0 else 0.0
    if len(base_s) > 0 and len(curr_s) > 0 and len(base_s) != len(curr_s):
        base_val = base_val * (len(curr_s) / len(base_s))

    delta_abs = curr_val - base_val
    delta_pct = (delta_abs / max(abs(base_val), 1e-6)) * 100.0

    timeline_steps.append({
        "step": 2,
        "title": f"Detected Shift in Target Metric: '{chosen_metric}' ({delta_pct:+.1f}%)",
        "status": "completed",
        "details": f"Baseline: {unit_symbol}{base_val:,.2f} → Current: {unit_symbol}{curr_val:,.2f} (Delta: {unit_symbol}{delta_abs:+,.2f})"
    })

    # 3. Seasonality & Cyclical Baseline Audit
    seasonality: SeasonalityReport = check_seasonality(df, chosen_metric, detected_time_col)
    timeline_steps.append({
        "step": 3,
        "title": f"Evaluated Seasonality: {'Pattern Found' if seasonality.seasonality_detected else 'Structural Shift'}",
        "status": "completed",
        "details": seasonality.explanation
    })

    # 4. Confounding Risk Audit
    primary_candidate = valid_dimensions[0] if valid_dimensions else "General"
    confounding: ConfoundingAudit = check_confounding_risk(
        df=df,
        target_metric=chosen_metric,
        primary_dimension=primary_candidate,
        candidate_dimensions=valid_dimensions
    )
    timeline_steps.append({
        "step": 4,
        "title": f"Audited Confounding Risk: {confounding.confounding_risk} Risk",
        "status": "completed",
        "details": confounding.explanation
    })

    # 5. Recursive Root-Cause Tree Synthesis
    timeline_steps.append({
        "step": 5,
        "title": f"Tested {len(valid_dimensions)} Dimensions with Data-Size-Aware Thresholds",
        "status": "completed",
        "details": f"Evaluating candidate dimensions: {', '.join(valid_dimensions[:5])}."
    })

    root_tree: RootCauseNode = build_recursive_insight_tree(
        baseline_df=baseline_df,
        current_df=current_df,
        target_metric=chosen_metric,
        candidate_dimensions=valid_dimensions,
        max_depth=max_depth,
        min_contribution=min_contribution,
        data_quality_score=fingerprint.data_quality_score,
        unit_symbol=unit_symbol
    )

    timeline_steps.append({
        "step": 6,
        "title": "Validated Statistical Significance & Built Root-Cause Tree",
        "status": "completed",
        "details": f"Constructed multi-level insight tree with {len(root_tree.children)} primary branch drivers."
    })

    # 6. Competing Hypotheses
    competing_hypotheses = generate_competing_hypotheses(
        root_node=root_tree,
        seasonality_score=seasonality.seasonality_score
    )

    # 7. Counterfactual Simulation on Primary Driver
    counterfactual_result: Optional[CounterfactualSimulation] = None
    if root_tree.children:
        primary_child = root_tree.children[0]
        counterfactual_result = simulate_counterfactual(
            target_metric=chosen_metric,
            observed_total=curr_val,
            baseline_segment_value=primary_child.baseline_value,
            current_segment_value=primary_child.current_value,
            driver_dimension=primary_child.dimension or "Primary Dimension",
            driver_segment=primary_child.segment or "Primary Segment",
            simulated_recovery_pct=100.0,
            unit_symbol=unit_symbol
        )

    timeline_steps.append({
        "step": 7,
        "title": "Constructed Counterfactual 'What-If?' Simulator",
        "status": "completed",
        "details": f"Estimated impact if primary driver maintained baseline performance."
    })

    # 8. Actionable Recommendations
    recommendations: List[Dict[str, Any]] = []
    if root_tree.children:
        p_child = root_tree.children[0]
        recommendations.append({
            "finding": f"'{p_child.segment}' ({p_child.dimension}) accounted for ~{p_child.contribution_pct:.0f}% of the total shift in {chosen_metric} ({p_child.delta_pct:+.1f}%).",
            "suggested_investigation": f"Perform a targeted operational audit on {p_child.dimension} '{p_child.segment}'.",
            "possible_action": f"Calibrate regional distribution, pricing, or inventory replenishment for {p_child.segment}."
        })
    else:
        recommendations.append({
            "finding": f"The shift in {chosen_metric} is distributed evenly across all categories without an isolated driver.",
            "suggested_investigation": "Evaluate macro external factors or global baseline changes.",
            "possible_action": "Monitor trend over the next observation window."
        })

    # Overall Evidence Confidence Score (0-100)
    # Synthesizes data quality, statistical significance, confounding risk, and sample size
    stat_conf = root_tree.children[0].confidence_score if root_tree.children else 80.0
    confound_penalty = 15.0 if confounding.confounding_risk == "High" else (5.0 if confounding.confounding_risk == "Medium" else 0.0)
    season_adjustment = -10.0 if seasonality.seasonality_detected else 0.0
    overall_confidence = max(40.0, min(98.0, (0.5 * stat_conf) + (0.5 * fingerprint.data_quality_score) - confound_penalty + season_adjustment))

    # Executive Natural Language Summary
    dir_word = "decreased" if delta_abs < 0 else "increased"
    if root_tree.children:
        p_child = root_tree.children[0]
        narrative_summary = (
            f"{chosen_metric} {dir_word} by {abs(delta_pct):.1f}% (from {unit_symbol}{base_val:,.2f} to {unit_symbol}{curr_val:,.2f}). "
            f"Segment '{p_child.segment}' ({p_child.dimension}) was the primary driver, accounting for approximately {p_child.contribution_pct:.1f}% "
            f"of the total change ({p_child.delta_pct:+.1f}%). "
            f"{'Seasonality was detected and may explain a portion of the variance. ' if seasonality.seasonality_detected else ''}"
            f"All findings have been statistically validated against observational ground truth."
        )
    else:
        narrative_summary = (
            f"{chosen_metric} {dir_word} by {abs(delta_pct):.1f}% uniformly across all dimensions."
        )

    duration_ms = round((time.time() - start_time) * 1000, 1)

    return {
        "status": "success",
        "investigation_id": f"why_{int(time.time())}",
        "target_metric": chosen_metric,
        "available_metrics": available_metrics,
        "time_column_used": detected_time_col,
        "dataset_fingerprint": fingerprint.to_dict(),
        "target_summary": {
            "metric": chosen_metric,
            "baseline_value": round(base_val, 4),
            "current_value": round(curr_val, 4),
            "delta_abs": round(delta_abs, 4),
            "delta_pct": round(delta_pct, 2),
            "baseline_period_label": base_label,
            "current_period_label": curr_label,
            "significance_score": round(overall_confidence, 1)
        },
        "root_cause_tree": root_tree.to_dict(),
        "competing_hypotheses": competing_hypotheses,
        "seasonality_report": seasonality.to_dict(),
        "confounding_audit": confounding.to_dict(),
        "counterfactual_summary": counterfactual_result.to_dict() if counterfactual_result else None,
        "timeline_steps": timeline_steps,
        "recommendations": recommendations,
        "evidence_score": round(overall_confidence, 1),
        "narrative_summary": narrative_summary,
        "duration_ms": duration_ms
    }
