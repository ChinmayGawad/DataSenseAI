"""
Investigation API endpoints.
Provides real-time job status, agent execution logs for the timeline, investigation plans,
and conversational natural language query answering with multi-tenant scoping.
"""

from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
for p in [str(ROOT_DIR), str(ROOT_DIR / "harness"), str(ROOT_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from harness.adapter import query_dataset
from ..schemas.investigation import JobStatusResponse, QueryRequest, QueryResponse
from ..services.job_store import job_store
from ..core.auth import TenantUser, get_current_tenant_user, verify_tenant_access

router = APIRouter(prefix="", tags=["Investigation & Timeline"])


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_investigation_status(
    job_id: str,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Poll or stream the progress of the multi-agent investigation.
    Returns agent logs formatted for the Agent Timeline UI.
    Enforces multi-tenant authorization.
    """
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Investigation job '{job_id}' not found")

    verify_tenant_access(current_user, job.get("tenant_id"))
    return JobStatusResponse(**job)


@router.post("/query", response_model=QueryResponse)
async def query_dataset_endpoint(
    payload: QueryRequest,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Answers natural language questions against the uploaded dataset with verified Python facts.
    Enforces tenant access boundary.
    """
    dataset_id = payload.dataset_id
    if not dataset_id and payload.job_id:
        job = job_store.get_job(payload.job_id)
        if job:
            verify_tenant_access(current_user, job.get("tenant_id"))
            dataset_id = job.get("dataset_id")

    if not dataset_id:
        raise HTTPException(status_code=400, detail="Must provide either dataset_id or job_id")

    dataset_info = job_store.get_dataset(dataset_id)
    if not dataset_info or not dataset_info.get("file_path"):
        raise HTTPException(status_code=404, detail="Dataset not found")

    verify_tenant_access(current_user, dataset_info.get("tenant_id"))

    file_path = dataset_info["file_path"]
    try:
        result = query_dataset(dataset_path=file_path, question=payload.question)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
