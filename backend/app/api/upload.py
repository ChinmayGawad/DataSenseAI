"""
Upload and Ingestion API endpoints.
Handles secure file uploads (CSV, Excel), parses initial schema, and initiates investigation.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pathlib import Path
from ..config import settings
from ..schemas.dataset import DatasetUploadResponse, DatasetMetadataResponse
from ..schemas.investigation import InvestigationJobCreate
from ..services.storage_service import storage_service
from ..services.job_store import job_store
from ..services.pipeline_runner import execute_investigation_pipeline

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
    background_tasks: BackgroundTasks = None
):
    """
    Upload an unknown spreadsheet (CSV or Excel).
    Validates format, checks file limits, saves file, and registers dataset metadata.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    dataset_id, file_path, file_size = storage_service.save_file(file_bytes, file.filename)

    # Initial fast parse for row and col count
    try:
        df = storage_service.load_dataframe(file_path)
        row_count, col_count = df.shape
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse spreadsheet: {str(e)}")

    job_store.register_dataset(dataset_id, {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_size": file_size,
        "row_count": row_count,
        "column_count": col_count,
        "format": ext.replace(".", "")
    })

    return DatasetUploadResponse(
        dataset_id=dataset_id,
        filename=file.filename,
        file_size_bytes=file_size,
        row_count=row_count,
        column_count=col_count,
        file_format=ext.replace(".", ""),
        message="Dataset uploaded successfully. Ready for agent investigation."
    )


@router.post("/investigate")
async def start_investigation(
    payload: InvestigationJobCreate,
    background_tasks: BackgroundTasks
):
    """
    Trigger the 8-agent investigation pipeline for a given uploaded dataset.
    """
    ds = job_store.get_dataset(payload.dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = Path(ds["file_path"])
    job_id = job_store.create_job(payload.dataset_id)

    # Launch pipeline in background
    background_tasks.add_task(
        execute_investigation_pipeline,
        job_id=job_id,
        file_path=file_path,
        filename=ds["filename"]
    )

    return {
        "job_id": job_id,
        "dataset_id": payload.dataset_id,
        "status": "queued",
        "message": "Autonomous multi-agent investigation initiated."
    }
