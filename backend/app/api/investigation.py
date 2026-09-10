"""
Investigation API endpoints.
Provides real-time job status, agent execution logs for the timeline, investigation plans,
and conversational natural language query answering with multi-tenant scoping.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pathlib import Path
import asyncio
import json
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
    Poll the progress of the multi-agent investigation.
    Returns agent logs formatted for the Agent Timeline UI.
    Enforces multi-tenant authorization.
    """
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Investigation job '{job_id}' not found")

    verify_tenant_access(current_user, job.get("tenant_id"))
    return JobStatusResponse(**job)


@router.get("/status/{job_id}/stream")
async def stream_investigation_status(
    job_id: str,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Stream real-time multi-agent execution events via Server-Sent Events (SSE).
    Provides instant sub-100ms updates to the Agent Timeline UI without HTTP polling overhead.
    """
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Investigation job '{job_id}' not found")

    verify_tenant_access(current_user, job.get("tenant_id"))

    async def event_generator():
        last_log_count = 0
        last_progress = -1
        last_status = None
        start_time = asyncio.get_event_loop().time()
        max_duration = 300  # 5 minute max stream lifetime

        initial_job = job_store.get_job(job_id)
        if initial_job:
            yield f"data: {json.dumps({'type': 'init', 'job_id': job_id, 'status': initial_job.get('status'), 'progress_percentage': initial_job.get('progress_percentage', 0), 'logs': initial_job.get('logs', []), 'summary': initial_job.get('summary')})}\n\n"
            last_log_count = len(initial_job.get("logs", []))
            last_progress = initial_job.get("progress_percentage", 0)
            last_status = initial_job.get("status")

        while True:
            await asyncio.sleep(0.2)
            current_job = job_store.get_job(job_id)
            if not current_job:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Job no longer found'})}\n\n"
                break

            current_logs = current_job.get("logs", [])
            current_progress = current_job.get("progress_percentage", 0)
            current_status = current_job.get("status")

            if len(current_logs) > last_log_count or current_progress != last_progress or current_status != last_status:
                new_logs = current_logs[last_log_count:]
                last_log_count = len(current_logs)
                last_progress = current_progress
                last_status = current_status

                payload = {
                    "type": "update",
                    "job_id": job_id,
                    "status": current_status,
                    "current_agent": current_job.get("current_agent"),
                    "progress_percentage": current_progress,
                    "health_score": current_job.get("health_score"),
                    "new_logs": new_logs,
                    "summary": current_job.get("summary")
                }
                yield f"data: {json.dumps(payload)}\n\n"

            if current_status in ("completed", "failed"):
                yield f"data: {json.dumps({'type': 'complete', 'job_id': job_id, 'status': current_status, 'summary': current_job.get('summary'), 'error_message': current_job.get('error_message')})}\n\n"
                break

            if asyncio.get_event_loop().time() - start_time > max_duration:
                yield f"data: {json.dumps({'type': 'timeout', 'message': 'Stream reached max duration'})}\n\n"
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


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
