"""
Pydantic Schemas for the Why? Engine (Autonomous Root-Cause Analysis).
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class WhyInvestigationRequest(BaseModel):
    job_id: str
    target_metric: Optional[str] = None
    time_column: Optional[str] = None
    max_depth: int = Field(default=3, ge=1, le=5)
    min_contribution: float = Field(default=10.0, ge=1.0, le=100.0)
    comparison_mode: Optional[str] = "auto"


class CounterfactualRequest(BaseModel):
    job_id: str
    target_metric: str
    driver_dimension: str
    driver_segment: str
    baseline_value: float
    current_value: float
    observed_total: float
    simulated_recovery_pct: float = Field(default=100.0, ge=0.0, le=200.0)


class CounterfactualResponse(BaseModel):
    driver_dimension: str
    driver_segment: str
    observed_total: float
    counterfactual_total: float
    estimated_difference_abs: float
    estimated_difference_pct: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    evidence_strength: str
    scenario_description: str
    narrative_explanation: str
    unit_symbol: str = ""


class DatasetComparisonRequest(BaseModel):
    job_id_a: str
    job_id_b: str
    target_metric: Optional[str] = None
    label_a: Optional[str] = "Dataset A (Baseline)"
    label_b: Optional[str] = "Dataset B (Current)"


class DatasetComparisonResponse(BaseModel):
    status: str = "success"
    label_a: str
    label_b: str
    row_count_a: int
    row_count_b: int
    shared_columns_count: int
    metric_comparisons: List[Dict[str, Any]]
    summary_headline: str


class EvidenceDetailResponse(BaseModel):
    node_id: str
    target_metric: str
    dimension: Optional[str] = None
    segment: Optional[str] = None
    baseline_value: float
    current_value: float
    delta_abs: float
    delta_pct: float
    contribution_pct: float
    sample_size_before: int
    sample_size_after: int
    formula_breakdown: str
    step_by_step_calculation: List[str]
    statistical_test_name: str
    test_statistic: float
    p_value: float
    effect_size_metric: str
    effect_size_value: float
    confounding_assessment: str
    seasonality_assessment: str
    subsegment_table: List[Dict[str, Any]] = Field(default_factory=list)
    unit_symbol: str = ""


class WhyInvestigationResponse(BaseModel):
    status: str = "success"
    investigation_id: str
    job_id: str
    target_metric: str
    available_metrics: List[str] = Field(default_factory=list)
    time_column_used: Optional[str] = None
    dataset_fingerprint: Dict[str, Any] = Field(default_factory=dict)
    target_summary: Dict[str, Any] = Field(default_factory=dict)
    root_cause_tree: Dict[str, Any] = Field(default_factory=dict)
    competing_hypotheses: List[Dict[str, Any]] = Field(default_factory=list)
    seasonality_report: Dict[str, Any] = Field(default_factory=dict)
    confounding_audit: Dict[str, Any] = Field(default_factory=dict)
    counterfactual_summary: Optional[Dict[str, Any]] = None
    timeline_steps: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_score: float = 90.0
    narrative_summary: str = ""
    executive_headline: str = ""
    duration_ms: float = 0.0
