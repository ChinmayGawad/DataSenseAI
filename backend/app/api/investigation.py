"""
Investigation API endpoints.
Provides real-time job status, agent execution logs for the timeline, and investigation plans.
"""

from fastapi import APIRouter, HTTPException
from ..schemas.investigation import JobStatusResponse
from ..services.job_store import job_store

router = APIRouter(prefix="", tags=["Investigation & Timeline"])


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_investigation_status(job_id: str):
    """
    Poll or stream the progress of the multi-agent investigation.
    Returns agent logs formatted for the Agent Timeline UI.
    """
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Investigation job '{job_id}' not found")

    return JobStatusResponse(**job)
