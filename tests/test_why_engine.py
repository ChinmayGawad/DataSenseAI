"""
Unit and Integration Test Suite for the Why? Engine (Autonomous Root-Cause Analysis Module).
Tests data profiling, change detection, contribution decomposition, statistical tests,
recursive tree synthesis, counterfactual simulations, and dataset comparison.
"""

import sys
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

# Ensure paths
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR / "core-ml"))

from why_engine.profiler import profile_dataset, is_identifier_column
from why_engine.change_detector import detect_all_metric_changes, calculate_change_significance, partition_dataframe_by_time
from why_engine.contribution import analyze_dimension_contributions
from why_engine.statistical_tests import (
    validate_before_vs_after,
    validate_categorical_vs_numeric,
    validate_categorical_vs_categorical,
    calculate_cohens_d
)
from why_engine.driver_ranker import score_and_classify_driver
from why_engine.seasonality import check_seasonality
from why_engine.confounding import check_confounding_risk
from why_engine.counterfactual import simulate_counterfactual
from why_engine.tree_builder import build_recursive_insight_tree, generate_competing_hypotheses
from why_engine.dataset_comparator import compare_two_datasets
from why_engine.orchestrator import run_why_investigation


@pytest.fixture
def sample_retail_df():
    csv_path = ROOT_DIR / "datasets" / "retail_sales.csv"
    return pd.read_csv(csv_path)


@pytest.fixture
def sample_marketing_df():
    csv_path = ROOT_DIR / "datasets" / "marketing_campaign.csv"
    return pd.read_csv(csv_path)


@pytest.fixture
def sample_healthcare_df():
    csv_path = ROOT_DIR / "datasets" / "healthcare_data.csv"
    return pd.read_csv(csv_path)


def test_profiler_and_identifier_detection(sample_retail_df):
    fingerprint = profile_dataset(sample_retail_df)
    assert fingerprint.total_rows > 0
    assert fingerprint.total_columns > 0
    assert "Sales" in fingerprint.metric_columns
    assert "Region" in fingerprint.dimension_columns
    assert "Order_ID" in fingerprint.identifier_columns
    assert fingerprint.data_quality_score > 0
    assert "Retail" in fingerprint.detected_domain or "E-Commerce" in fingerprint.detected_domain or "Business" in fingerprint.detected_domain


def test_change_detector_and_partitioning(sample_retail_df):
    base_df, curr_df, label_b, label_c = partition_dataframe_by_time(sample_retail_df, time_col="Order_Date")
    assert len(base_df) > 0
    assert len(curr_df) > 0

    changes = detect_all_metric_changes(sample_retail_df, metric_columns=["Sales", "Profit"], time_column="Order_Date")
    assert len(changes) == 2
    top_change = changes[0]
    assert top_change.significance_score >= 0
    assert top_change.statistical_confidence >= 0


def test_contribution_analysis_math(sample_retail_df):
    base_df, curr_df, _, _ = partition_dataframe_by_time(sample_retail_df, time_col="Order_Date")
    contrib_res = analyze_dimension_contributions(
        baseline_df=base_df,
        current_df=curr_df,
        target_metric="Sales",
        dimension_col="Region"
    )
    assert "segment_contributions" in contrib_res
    assert len(contrib_res["segment_contributions"]) > 0
    # Additivity assertion
    assert contrib_res["additivity_verified"] is True


def test_statistical_tests():
    # 1. Before vs After
    g1 = pd.Series([100, 102, 98, 105, 99, 101])
    g2 = pd.Series([60, 62, 58, 65, 59, 61])
    res_bva = validate_before_vs_after(g1, g2)
    assert res_bva.is_statistically_significant is True
    assert res_bva.p_value < 0.01
    assert abs(res_bva.effect_size_value) > 0.8  # Large effect size

    # 2. ANOVA
    df_cat = pd.DataFrame({
        "group": ["A"] * 20 + ["B"] * 20 + ["C"] * 20,
        "metric": list(np.random.normal(10, 2, 20)) + list(np.random.normal(30, 2, 20)) + list(np.random.normal(50, 2, 20))
    })
    res_anova = validate_categorical_vs_numeric(df_cat, "group", "metric")
    assert res_anova.is_statistically_significant is True
    assert res_anova.effect_size_value > 0.5

    # 3. Chi-square
    df_chi = pd.DataFrame({
        "payment": ["COD"] * 50 + ["Prepaid"] * 50,
        "cancelled": ["Yes"] * 40 + ["No"] * 10 + ["Yes"] * 5 + ["No"] * 45
    })
    res_chi = validate_categorical_vs_categorical(df_chi, "payment", "cancelled")
    assert res_chi.is_statistically_significant is True
    assert res_chi.effect_size_value > 0.3


def test_driver_ranker_and_scoring():
    driver = score_and_classify_driver(
        dimension="Product",
        segment="Smartphone",
        delta_abs=-576000.0,
        delta_pct=-72.0,
        contribution_pct=72.0,
        p_value=0.0001,
        effect_size=1.2,
        sample_size=420,
        total_dataset_size=10000,
        data_quality_score=92.0
    )
    assert driver.composite_score >= 70.0
    assert driver.classification == "PRIMARY_DRIVER"
    assert len(driver.evidence_points) == 3


def test_counterfactual_simulation():
    sim = simulate_counterfactual(
        target_metric="Sales",
        observed_total=7600000.0,
        baseline_segment_value=2500000.0,
        current_segment_value=1500000.0,
        driver_dimension="Region",
        driver_segment="Nashik",
        simulated_recovery_pct=100.0,
        unit_symbol="₹"
    )
    # 7.6M - (-1.0M) = 8.6M
    assert sim.counterfactual_total > sim.observed_total
    assert sim.estimated_difference_abs == 1000000.0
    assert sim.evidence_strength == "High"
    assert "₹" in sim.narrative_explanation


def test_tree_builder_and_competing_hypotheses(sample_retail_df):
    base_df, curr_df, _, _ = partition_dataframe_by_time(sample_retail_df, time_col="Order_Date")
    tree = build_recursive_insight_tree(
        baseline_df=base_df,
        current_df=curr_df,
        target_metric="Sales",
        candidate_dimensions=["Region", "Product_Category"],
        max_depth=3,
        min_contribution=5.0
    )
    assert tree.id == "root"
    assert tree.target_metric == "Sales"
    assert len(tree.children) > 0

    hypotheses = generate_competing_hypotheses(tree, seasonality_score=35.0)
    assert len(hypotheses) >= 2
    assert hypotheses[0]["confidence"] > 0


def test_dataset_comparator(sample_retail_df):
    df_a = sample_retail_df.iloc[:len(sample_retail_df)//2].copy()
    df_b = sample_retail_df.iloc[len(sample_retail_df)//2:].copy()
    diff = compare_two_datasets(df_a, df_b, "2024 Period 1", "2024 Period 2")
    assert diff["status"] == "success"
    assert len(diff["metric_comparisons"]) > 0


def test_full_orchestrator_on_all_domains(sample_retail_df, sample_marketing_df, sample_healthcare_df):
    # 1. Retail
    res_retail = run_why_investigation(sample_retail_df, target_metric="Sales", time_column="Order_Date")
    assert res_retail["status"] == "success"
    assert res_retail["evidence_score"] > 0
    assert len(res_retail["timeline_steps"]) >= 6
    assert len(res_retail["recommendations"]) > 0

    # 2. Marketing
    res_mkt = run_why_investigation(sample_marketing_df)
    assert res_mkt["status"] == "success"
    assert res_mkt["dataset_fingerprint"]["total_rows"] > 0

    # 3. Healthcare
    res_health = run_why_investigation(sample_healthcare_df)
    assert res_health["status"] == "success"
    assert res_health["root_cause_tree"] is not None
