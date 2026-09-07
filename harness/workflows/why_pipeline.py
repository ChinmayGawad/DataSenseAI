"""
Why? Engine Workflow:
Coordinates multi-agent telemetry and invokes the Core ML Why? Engine for live progress streaming.
"""

from pathlib import Path
import sys
from typing import Dict, Any, Optional, Callable
import pandas as pd

# Ensure paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CORE_ML_DIR = ROOT_DIR / "core-ml"
for p in [str(ROOT_DIR), str(CORE_ML_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from why_engine.orchestrator import run_why_investigation
from why_engine.counterfactual import simulate_counterfactual
from why_engine.dataset_comparator import compare_two_datasets
from plugins.data_tools import load_dataframe
from agents.why_analyst import run_why_analyst_agent


def execute_why_workflow(
    dataset_path: str,
    target_metric: Optional[str] = None,
    time_column: Optional[str] = None,
    max_depth: int = 3,
    min_contribution: float = 10.0,
    unit_symbol: str = "",
    event_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Dict[str, Any]:
    """
    Executes the multi-agent Why? Root-Cause Analysis pipeline with live telemetry events.
    """
    def emit(agent: str, icon: str, action: str, details: str, status: str = "in_progress"):
        if event_callback:
            event_callback({
                "agent": agent,
                "agent_icon": icon,
                "action": action,
                "details": details,
                "status": status,
            })

    emit("Data Detective", "🔍", "profile_dataset", "Scanning dataset for semantic types, identifiers, and dimensions...")
    raw_df = load_dataframe(dataset_path)

    emit("Change Detector", "📉", "detect_shifts", "Detecting significant metric movements across periods...")
    why_result = run_why_investigation(
        df=raw_df,
        target_metric=target_metric,
        time_column=time_column,
        max_depth=max_depth,
        min_contribution=min_contribution,
        unit_symbol=unit_symbol
    )

    emit("Contribution Engine", "⚖️", "quantify_contributions", "Calculating mathematical segment contributions and additivity...")
    emit("Statistical Validator", "🔬", "validate_relationships", "Applying hypothesis tests (ANOVA, t-test, Chi-square, Cohen's d)...")
    emit("Seasonality Inspector", "📅", "audit_seasonality", "Testing periodic cycles and confounding risk across strata...")

    emit("Why Analyst", "💡", "synthesize_explanation", "Synthesizing executive root-cause narrative...")
    analyst_insights = run_why_analyst_agent(why_result)
    why_result["executive_headline"] = analyst_insights.get("executive_headline", why_result.get("target_metric", "Metric Shift"))
    why_result["narrative_summary"] = analyst_insights.get("detailed_explanation", why_result.get("narrative_summary", ""))

    emit("AI Fact Checker", "✅", "verify_ground_truth", "Verifying all claims against Python calculated facts...", status="completed")

    return why_result
