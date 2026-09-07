"""
Why? Engine: Autonomous Root-Cause Analysis Module
Exposes core ML algorithms, statistical validation, recursive tree builders,
counterfactual simulation, and orchestration workflows.
"""

from .profiler import profile_dataset, DatasetFingerprint, is_identifier_column
from .change_detector import detect_all_metric_changes, calculate_change_significance, partition_dataframe_by_time, MetricChange
from .contribution import analyze_dimension_contributions, SegmentContribution
from .statistical_tests import (
    validate_before_vs_after,
    validate_categorical_vs_numeric,
    validate_categorical_vs_categorical,
    calculate_cohens_d,
    StatisticalValidationResult
)
from .driver_ranker import score_and_classify_driver, rank_candidate_drivers, RankedDriver
from .seasonality import check_seasonality, SeasonalityReport
from .confounding import check_confounding_risk, ConfoundingAudit
from .counterfactual import simulate_counterfactual, CounterfactualSimulation
from .evidence import build_evidence_package, EvidencePackage
from .tree_builder import build_recursive_insight_tree, generate_competing_hypotheses, RootCauseNode
from .dataset_comparator import compare_two_datasets
from .orchestrator import run_why_investigation

__all__ = [
    "profile_dataset",
    "DatasetFingerprint",
    "is_identifier_column",
    "detect_all_metric_changes",
    "calculate_change_significance",
    "partition_dataframe_by_time",
    "MetricChange",
    "analyze_dimension_contributions",
    "SegmentContribution",
    "validate_before_vs_after",
    "validate_categorical_vs_numeric",
    "validate_categorical_vs_categorical",
    "calculate_cohens_d",
    "StatisticalValidationResult",
    "score_and_classify_driver",
    "rank_candidate_drivers",
    "RankedDriver",
    "check_seasonality",
    "SeasonalityReport",
    "check_confounding_risk",
    "ConfoundingAudit",
    "simulate_counterfactual",
    "CounterfactualSimulation",
    "build_evidence_package",
    "EvidencePackage",
    "build_recursive_insight_tree",
    "generate_competing_hypotheses",
    "RootCauseNode",
    "compare_two_datasets",
    "run_why_investigation",
]
