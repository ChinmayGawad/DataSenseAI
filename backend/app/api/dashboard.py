"""
Dashboard API endpoints.
Provides the self-designing dashboard JSON configuration containing Plotly specs,
fact-checked insights, and summary KPI metrics.
"""

from fastapi import APIRouter, HTTPException
from ..schemas.dashboard import DashboardResponse
from ..services.job_store import job_store

router = APIRouter(prefix="", tags=["Dashboard & Visualizations"])


@router.get("/dashboard/{job_id}", response_model=DashboardResponse)
async def get_dashboard(job_id: str):
    """
    Retrieves the generated dynamic dashboard for a completed investigation job.
    Includes Plotly configurations, why-chosen rationales, and verified insights.
    """
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Investigation is currently '{job['status']}'. Wait for completion."
        )

    dashboard = job_store.get_dashboard(job_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not yet available")

    return DashboardResponse(**dashboard)
