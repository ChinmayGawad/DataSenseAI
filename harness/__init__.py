"""
DeepSeek Harness Multi-Agent Runtime for DataSense AI.
Orchestrates autonomous data investigation across specialized agent plugins.
"""

from .schema import (
    InvestigationContext,
    InvestigationResult,
    AgentEvent,
    ColumnRoleInfo,
    QualityReportSchema,
    CleaningActionSchema,
    HypothesisPlan,
    MLFindingsSchema,
    ChartSpecSchema,
    VerifiedInsight,
)
from .workflows.investigation_pipeline import run_investigation_pipeline

__all__ = [
    "InvestigationContext",
    "InvestigationResult",
    "AgentEvent",
    "ColumnRoleInfo",
    "QualityReportSchema",
    "CleaningActionSchema",
    "HypothesisPlan",
    "MLFindingsSchema",
    "ChartSpecSchema",
    "VerifiedInsight",
    "run_investigation_pipeline",
]
