from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class AgentLogItem(BaseModel):
    id: str
    job_id: str
    agent_name: str
    agent_icon: str
    step_title: str
    description: str
    status: str = "in_progress"  # in_progress, completed, warning, failed
    details: Dict[str, Any] = Field(default_factory=dict)
    duration_ms: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvestigationPlanItem(BaseModel):
    step_number: int
    question: str
    analysis_type: str  # correlation, outlier, trend, distribution, cluster
    target_columns: List[str]
    rationale: str
    priority: str = "high"


class InvestigationJobCreate(BaseModel):
    dataset_id: str


class JobStatusResponse(BaseModel):
    job_id: str
    dataset_id: str
    status: str  # queued, running, completed, failed
    current_agent: Optional[str] = None
    progress_percentage: int = 0
    health_score: Optional[float] = None
    summary: Optional[str] = None
    error_message: Optional[str] = None
    logs: List[AgentLogItem] = Field(default_factory=list)
    plan: List[InvestigationPlanItem] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QueryRequest(BaseModel):
    job_id: Optional[str] = None
    dataset_id: Optional[str] = None
    question: str


class QueryResponse(BaseModel):
    status: str
    question: str
    answer: str
    key_takeaway: str = ""
    fact_check: Dict[str, Any] = Field(default_factory=dict)
    query_details: Dict[str, Any] = Field(default_factory=dict)
    supporting_table: List[Dict[str, Any]] = Field(default_factory=list)
