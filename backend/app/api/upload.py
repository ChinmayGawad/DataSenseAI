"""
Upload and Ingestion API endpoints.
Handles secure file uploads (CSV, Excel), parses initial schema, and initiates investigation
with multi-tenant scoping and pluggable job queue broker execution.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from pathlib import Path
from ..config import settings
from ..schemas.dataset import DatasetUploadResponse, DatasetMetadataResponse
from ..schemas.investigation import InvestigationJobCreate
from ..services.storage_service import storage_service
from ..services.job_store import job_store
from ..core.auth import TenantUser, get_current_tenant_user, verify_tenant_access
from ..tasks.broker import job_broker

import sys
CORE_ML_DIR = Path(__file__).resolve().parent.parent.parent.parent / "core-ml"
if str(CORE_ML_DIR) not in sys.path:
    sys.path.append(str(CORE_ML_DIR))
from column_inspector import detect_column_types
from quality_inspector import inspect_data_quality

router = APIRouter(prefix="", tags=["Upload & Ingestion"])


@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Upload an unknown spreadsheet (CSV or Excel).
    Validates format, checks file limits, saves file in tenant storage partition,
    and registers dataset metadata.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty (0 bytes). Please upload a valid CSV or Excel spreadsheet."
        )

    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Save to tenant-isolated storage partition
    dataset_id, file_path, file_size = storage_service.save_file(
        file_bytes,
        file.filename,
        tenant_id=current_user.tenant_id
    )

    # Ingest document via Universal Ingestion Engine
    try:
        udr = storage_service.ingest_document(file_path, filename=file.filename)
        df = udr.primary_dataframe
        row_count, col_count = df.shape
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to ingest document: {str(e)}")

    dataset_record = {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_size": file_size,
        "row_count": row_count,
        "column_count": col_count,
        "format": ext.replace(".", ""),
        "file_type": udr.file_type,
        "total_pages": udr.total_pages,
        "tables_extracted": len(udr.tables),
        "extraction_confidence": udr.extraction_confidence_overall,
        "has_handwritten_content": udr.has_handwritten_content,
        "uncertain_fields_count": udr.uncertain_fields_count,
        "uncertain_fields": [u.to_dict() for u in udr.uncertain_fields],
        "tables_summary": [t.to_dict() for t in udr.tables],
        "extraction_log": udr.extraction_log
    }

    job_store.register_dataset(
        dataset_id=dataset_id,
        data=dataset_record,
        tenant_id=current_user.tenant_id
    )

    return DatasetUploadResponse(
        dataset_id=dataset_id,
        filename=file.filename,
        file_size_bytes=file_size,
        row_count=row_count,
        column_count=col_count,
        file_format=ext.replace(".", ""),
        file_type=udr.file_type,
        total_pages=udr.total_pages,
        tables_extracted=len(udr.tables),
        extraction_confidence=udr.extraction_confidence_overall,
        has_handwritten_content=udr.has_handwritten_content,
        uncertain_fields_count=udr.uncertain_fields_count,
        uncertain_fields=[u.to_dict() for u in udr.uncertain_fields],
        tables_summary=[t.to_dict() for t in udr.tables],
        extraction_log=udr.extraction_log,
        message=f"Document ingested successfully via Universal Engine ({udr.file_type}). {len(udr.tables)} table(s) extracted across {udr.total_pages} page(s)."
    )


@router.post("/investigate")
async def start_investigation(
    payload: InvestigationJobCreate,
    background_tasks: BackgroundTasks,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Trigger the 8-agent investigation pipeline for a given uploaded dataset.
    Enforces tenant access verification and dispatches to Celery or BackgroundTasks broker.
    """
    ds = job_store.get_dataset(payload.dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Enforce tenant data boundary
    verify_tenant_access(current_user, ds.get("tenant_id"))

    file_path = Path(ds["file_path"])
    job_id = job_store.create_job(payload.dataset_id, tenant_id=current_user.tenant_id)

    # Dispatch via pluggable JobQueueBroker
    dispatch_info = job_broker.dispatch_investigation_job(
        job_id=job_id,
        file_path=file_path,
        filename=ds["filename"],
        tenant_id=current_user.tenant_id,
        background_tasks=background_tasks
    )

    return {
        "job_id": job_id,
        "dataset_id": payload.dataset_id,
        "tenant_id": current_user.tenant_id,
        "status": "queued",
        "dispatch_mode": dispatch_info.get("mode", "background_tasks"),
        "message": "Autonomous multi-agent investigation initiated."
    }
