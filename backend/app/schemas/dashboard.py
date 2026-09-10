from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ChartConfig(BaseModel):
    id: str
    title: str
    chart_type: str  # line, bar, scatter, heatmap, box, histogram
    x_axis: str
    y_axis: Optional[str] = None
    color_by: Optional[str] = None
    plotly_data: List[Dict[str, Any]] = Field(default_factory=list)
    plotly_layout: Dict[str, Any] = Field(default_factory=dict)
    why_chosen: str = Field(description="Transparency: Why did AI select this chart type?")
    key_takeaway: str = Field(description="Plain-language takeaway from the visual")
    decision_rule: Optional[str] = Field(default=None, description="Smart Rule-Based Decision Rule")
    detected_inputs: Optional[str] = Field(default=None, description="Detected Data Input Type")


class MetricCard(BaseModel):
    id: str
    label: str
    value: str
    delta: Optional[str] = None
    subtext: Optional[str] = None
    status: str = "normal"  # normal, success, warning, alert
    icon: Optional[str] = None


class FactCheckedInsight(BaseModel):
    id: str
    title: str
    statement: str
    category: str = "trend"  # trend, anomaly, correlation, distribution, quality
    importance: str = "high"  # high, medium, low
    is_verified: bool = True
    fact_check_verdict: str = "verified"  # verified, corrected, flagged
    math_proof: Dict[str, Any] = Field(
        default_factory=dict,
        description="Ground-truth numerical facts calculated by pure Python"
    )
    verification_notes: str = Field(
        description="Fact Checker agent log explaining how the claim was verified"
    )
    related_chart_id: Optional[str] = None
    confidence_score: float = 0.98


class DashboardResponse(BaseModel):
    job_id: str
    dataset_id: str
    dataset_name: str
    health_score: float
    quality_grade: str
    summary_cards: List[MetricCard]
    charts: List[ChartConfig]
    insights: List[FactCheckedInsight]
    cleaning_summary: Dict[str, Any] = Field(default_factory=dict)
    columns: List[Dict[str, Any]] = Field(default_factory=list)
    quality_report: Dict[str, Any] = Field(default_factory=dict)
    raw_rows: List[Dict[str, Any]] = Field(default_factory=list)
    cleaned_rows: List[Dict[str, Any]] = Field(default_factory=list)
    cleaning_diffs: List[Dict[str, Any]] = Field(default_factory=list)
    missing_value_rows: List[Dict[str, Any]] = Field(default_factory=list)
    outlier_rows: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DrilldownRequest(BaseModel):
    job_id: str
    finding_id: str
    question: Optional[str] = None


class DrilldownResponse(BaseModel):
    finding_id: str
    deep_dive_title: str
    investigation_summary: str
    evidence_points: List[str]
    supporting_chart: Optional[ChartConfig] = None
    recommended_actions: List[str]


class DatasetQueryRequest(BaseModel):
    job_id: str
    question: str


class DatasetQueryResponse(BaseModel):
    status: str = "success"
    question: str
    answer: str
    key_takeaway: str = ""
    fact_check: Dict[str, Any] = Field(default_factory=dict)
    supporting_table: List[Dict[str, Any]] = Field(default_factory=list)

