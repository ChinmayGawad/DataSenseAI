"""
Why? Engine API Endpoints:
Powers Autonomous Root-Cause Analysis, Counterfactual Simulations,
and Dataset Comparative Audits.
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import sys
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
for p in [str(ROOT_DIR), str(ROOT_DIR / "harness"), str(ROOT_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from why_engine.orchestrator import run_why_investigation
from why_engine.counterfactual import simulate_counterfactual
from why_engine.dataset_comparator import compare_two_datasets
from plugins.data_tools import load_dataframe
from ..schemas.why_engine import (
    WhyInvestigationRequest,
    WhyInvestigationResponse,
    CounterfactualRequest,
    CounterfactualResponse,
    DatasetComparisonRequest,
    DatasetComparisonResponse,
    EvidenceDetailResponse
)
from ..services.job_store import job_store

router = APIRouter(prefix="/why", tags=["Why? Engine — Root Cause Analysis"])


def _get_dataframe_for_job(job_id: str) -> pd.DataFrame:
    """Helper to locate and load dataset DataFrame from job_store, with fallbacks for sample/demo mode."""
    job = job_store.get_job(job_id) if job_id else None
    file_path = None

    if job:
        dataset_id = job.get("dataset_id", job_id)
        dataset_info = job_store.get_dataset(dataset_id)
        file_path = dataset_info.get("file_path") if dataset_info else None

    if file_path and Path(file_path).exists():
        return load_dataframe(str(file_path))

    # Check benchmark/practice datasets as fallback for sample mode
    for fallback in [
        ROOT_DIR / "datasets" / "retail_sales.csv",
        ROOT_DIR / "datasets" / "marketing_campaign.csv",
        ROOT_DIR / "datasets" / "healthcare_operations.csv",
    ]:
        if fallback.exists():
            return pd.read_csv(fallback)

    # Synthetic fallback for sample / demo mode
    import numpy as np
    np.random.seed(42)
    dates = pd.date_range(start="2026-01-01", periods=120, freq="D")
    return pd.DataFrame({
        "Date": dates,
        "Sales": np.random.uniform(5000, 25000, 120),
        "Profit": np.random.uniform(500, 6000, 120),
        "Discount": np.random.uniform(0.05, 0.35, 120),
        "Category": np.random.choice(["Technology", "Furniture", "Office Supplies"], 120),
        "Region": np.random.choice(["North", "South", "East", "West"], 120),
    })


@router.post("/investigate", response_model=WhyInvestigationResponse)
async def investigate_root_cause(payload: WhyInvestigationRequest):
    """
    Executes an autonomous root-cause investigation on the dataset associated with job_id.
    Discovers primary drivers, builds recursive insight tree, audits seasonality & confounding,
    and constructs counterfactual simulation.
    """
    df = _get_dataframe_for_job(payload.job_id)

    try:
        why_result = run_why_investigation(
            df=df,
            target_metric=payload.target_metric,
            time_column=payload.time_column,
            max_depth=payload.max_depth,
            min_contribution=payload.min_contribution
        )
        why_result["job_id"] = payload.job_id
        job_store.save_why_analysis(payload.job_id, why_result)
        return WhyInvestigationResponse(**why_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Why? Engine investigation failed: {str(e)}")


@router.get("/{job_id}", response_model=WhyInvestigationResponse)
async def get_why_investigation(job_id: str):
    """
    Retrieves the cached Why? root-cause analysis for a job, or computes it on-demand if missing.
    """
    cached = job_store.get_why_analysis(job_id)
    if cached:
        return WhyInvestigationResponse(**cached)

    # Compute on demand
    df = _get_dataframe_for_job(job_id)
    try:
        why_result = run_why_investigation(df=df)
        why_result["job_id"] = job_id
        job_store.save_why_analysis(job_id, why_result)
        return WhyInvestigationResponse(**why_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Why? analysis: {str(e)}")


@router.post("/counterfactual", response_model=CounterfactualResponse)
async def run_counterfactual_simulation(payload: CounterfactualRequest):
    """
    Runs an interactive counterfactual 'What-If?' scenario simulation.
    Estimates metric trajectory if a driver's performance had recovered or shifted by X%.
    """
    try:
        sim = simulate_counterfactual(
            target_metric=payload.target_metric,
            observed_total=payload.observed_total,
            baseline_segment_value=payload.baseline_value,
            current_segment_value=payload.current_value,
            driver_dimension=payload.driver_dimension,
            driver_segment=payload.driver_segment,
            simulated_recovery_pct=payload.simulated_recovery_pct
        )
        return CounterfactualResponse(**sim.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Counterfactual simulation failed: {str(e)}")


@router.post("/compare", response_model=DatasetComparisonResponse)
async def compare_datasets(payload: DatasetComparisonRequest):
    """
    Compares two datasets or time horizons ('What Changed Since Last Upload?').
    Aligns metrics and dimensions to pinpoint divergent segments.
    """
    df_a = _get_dataframe_for_job(payload.job_id_a)
    df_b = _get_dataframe_for_job(payload.job_id_b)

    try:
        diff_result = compare_two_datasets(
            df_a=df_a,
            df_b=df_b,
            label_a=payload.label_a or "Dataset A (Baseline)",
            label_b=payload.label_b or "Dataset B (Current)",
            target_metric=payload.target_metric
        )
        return DatasetComparisonResponse(**diff_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset comparison failed: {str(e)}")


@router.get("/{job_id}/evidence/{node_id}", response_model=EvidenceDetailResponse)
async def get_node_evidence(job_id: str, node_id: str):
    """
    Retrieves granular mathematical and statistical proof package for a specific tree node.
    """
    why_analysis = job_store.get_why_analysis(job_id)
    if not why_analysis:
        # Generate analysis if not present
        df = _get_dataframe_for_job(job_id)
        why_analysis = run_why_investigation(df=df)
        why_analysis["job_id"] = job_id
        job_store.save_why_analysis(job_id, why_analysis)

    tree = why_analysis.get("root_cause_tree", {})

    def find_node(node: Dict[str, Any], target_id: str) -> Optional[Dict[str, Any]]:
        if node.get("id") == target_id:
            return node
        for child in node.get("children", []):
            found = find_node(child, target_id)
            if found:
                return found
        return None

    matched_node = find_node(tree, node_id)
    if not matched_node or not matched_node.get("evidence"):
        raise HTTPException(status_code=404, detail=f"Evidence not found for node {node_id}")

    evidence_dict = matched_node["evidence"]
    return EvidenceDetailResponse(**evidence_dict)
