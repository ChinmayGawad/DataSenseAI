"""
Schema definitions for DeepSeek Harness multi-agent communication and output contracts.
"""

from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime


@dataclass
class AgentEvent:
    timestamp: str
    agent: str
    agent_icon: str
    action: str
    status: str  # "started" | "in_progress" | "completed" | "warning" | "error"
    details: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ColumnRoleInfo:
    name: str
    detected_type: str
    suggested_role: str
    pandas_dtype: str
    null_percentage: float
    unique_count: int
    is_id: bool
    is_date: bool
    is_numeric: bool
    is_categorical: bool
    sample_values: List[Any] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class QualityReportSchema:
    health_score: float
    quality_grade: str
    total_rows: int
    duplicate_rows_count: int
    total_missing_cells: int
    missing_cell_percentage: float
    columns_with_missing: List[Dict[str, Any]]
    constant_columns: List[str]
    issues_summary: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CleaningActionSchema:
    column: Optional[str]
    action_type: str
    strategy: str
    details: str
    reason: str
    fill_value: Optional[Any] = None
    affected_count: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class HypothesisPlan:
    id: str
    title: str
    objective: str
    target_columns: List[str]
    analysis_method: str
    priority: str  # "high" | "medium" | "low"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class MLFindingsSchema:
    correlations: List[Dict[str, Any]]
    outliers_detected: int
    outlier_percentage: float
    top_anomalies: List[Dict[str, Any]]
    clusters_found: int
    cluster_silhouette_score: float
    cluster_summaries: List[Dict[str, Any]]
    key_metrics: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ChartSpecSchema:
    id: str
    title: str
    type: str  # "bar" | "line" | "scatter" | "heatmap" | "cluster_scatter"
    x_axis: Optional[str]
    y_axis: Optional[str]
    plotly_data: List[Dict[str, Any]]
    plotly_layout: Dict[str, Any]
    why_chosen: str  # Transparent AI reasoning for chart selection
    priority_order: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class FactCheckReport:
    status: str  # "verified" | "corrected" | "unverified"
    ground_truth_metric: str
    verified_number: Optional[Union[float, int, str]]
    confidence: float
    validation_notes: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VerifiedInsight:
    id: str
    headline: str
    statement: str
    category: str  # "trend" | "anomaly" | "correlation" | "cluster" | "hygiene"
    importance: str  # "high" | "medium" | "low"
    actionable_recommendation: Optional[str]
    related_columns: List[str]
    fact_check: FactCheckReport

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class InvestigationContext:
    dataset_name: str
    original_shape: tuple
    columns_info: List[Dict[str, Any]]
    quality_report: Dict[str, Any]
    cleaning_report: Dict[str, Any]
    investigation_plan: List[Dict[str, Any]]
    ml_findings: Dict[str, Any]
    chart_specs: List[Dict[str, Any]]
    insights: List[Dict[str, Any]]
    timeline_events: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class InvestigationResult:
    status: str  # "success" | "error"
    dataset_name: str
    summary: Dict[str, Any]
    columns: List[Dict[str, Any]]
    quality: Dict[str, Any]
    cleaning: Dict[str, Any]
    investigation_plan: List[Dict[str, Any]]
    ml_findings: Dict[str, Any]
    charts: List[Dict[str, Any]]
    verified_insights: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
