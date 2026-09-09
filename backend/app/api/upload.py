"""
Upload and Ingestion API endpoints.
Handles secure single & multi-file uploads (CSV, Excel, Word, PPTX, PDF, OCR Images, JSON, TXT, ZIP),
parses initial schema, and initiates investigation with multi-tenant scoping and pluggable job queue broker execution.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from pathlib import Path
from typing import List, Optional
import uuid

from ..config import settings
from ..schemas.dataset import DatasetUploadResponse, DatasetMetadataResponse, FileMetadataItem
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
    file: Optional[UploadFile] = None,
    files: Optional[List[UploadFile]] = None,
    background_tasks: BackgroundTasks = None,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Universal Ingestion API: Upload single or multiple heterogeneous files (CSV, Excel, Word, PPTX, PDF, OCR Images, JSON, ZIP).
    Validates formats, stores files in tenant partition, extracts structured UDR,
    and returns comprehensive extraction audit with handwriting uncertainty detection.
    """
    upload_list: List[UploadFile] = []
    if files:
        for f in files:
            if hasattr(f, "filename") and f.filename:
                upload_list.append(f)
    if file and hasattr(file, "filename") and file.filename and file not in upload_list:
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(
            status_code=400,
            detail="No files provided for upload. Please select at least one document."
        )

    saved_paths: List[Path] = []
    saved_filenames: List[str] = []
    files_summary: List[FileMetadataItem] = []
    total_size_bytes = 0
    primary_dataset_id = str(uuid.uuid4())

    for f in upload_list:
        ext = Path(f.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}' in file '{f.filename}'. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
            )

        f_bytes = await f.read()
        if len(f_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"File '{f.filename}' is empty (0 bytes)."
            )

        if len(f_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File '{f.filename}' exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        f_id, f_path, f_size = storage_service.save_file(
            f_bytes,
            f.filename,
            tenant_id=current_user.tenant_id
        )
        saved_paths.append(f_path)
        saved_filenames.append(f.filename)
        total_size_bytes += f_size

    # Ingest using Universal Ingestion Engine
    try:
        if len(saved_paths) == 1:
            udr = storage_service.ingest_document(saved_paths[0], filename=saved_filenames[0])
            main_filename = saved_filenames[0]
            main_format = Path(main_filename).suffix.lower().replace(".", "")
            main_path = str(saved_paths[0])
        else:
            udr = storage_service.ingest_multiple_documents(saved_paths, filenames=saved_filenames)
            main_filename = f"Document Bundle ({len(saved_paths)} files)"
            main_format = "bundle"
            main_path = str(saved_paths[0])  # Anchor path

        df = udr.primary_dataframe
        row_count, col_count = df.shape

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to ingest document(s): {str(e)}")

    # Fast column profiling and data hygiene audit
    col_metadata = detect_column_types(df)
    quality_report = inspect_data_quality(
        df,
        extraction_metadata={
            "extraction_confidence": udr.extraction_confidence_overall,
            "has_handwritten_content": udr.has_handwritten_content,
            "uncertain_fields": [u.to_dict() for u in udr.uncertain_fields],
            "file_type": udr.file_type,
            "total_pages": udr.total_pages,
            "tables_extracted": len(udr.tables)
        }
    )

    sample_rows = df.head(10).replace({float('nan'): None}).to_dict(orient="records")

    # Build per-file summary items
    for idx, f_name in enumerate(saved_filenames):
        f_ext = Path(f_name).suffix.lower().replace(".", "")
        files_summary.append(FileMetadataItem(
            filename=f_name,
            file_type=f_ext,
            file_size_bytes=saved_paths[idx].stat().st_size if saved_paths[idx].exists() else 0,
            row_count=row_count if len(saved_filenames) == 1 else 0,
            column_count=col_count if len(saved_filenames) == 1 else 0,
            extraction_confidence=udr.extraction_confidence_overall,
            has_handwritten_content=udr.has_handwritten_content
        ))

    dataset_record = {
        "dataset_id": primary_dataset_id,
        "filename": main_filename,
        "file_path": main_path,
        "all_file_paths": [str(p) for p in saved_paths],
        "file_size": total_size_bytes,
        "row_count": row_count,
        "column_count": col_count,
        "format": main_format,
        "file_type": udr.file_type,
        "total_files_count": len(saved_paths),
        "files_summary": [f.model_dump() for f in files_summary],
        "total_pages": udr.total_pages,
        "tables_extracted": len(udr.tables),
        "extraction_confidence": udr.extraction_confidence_overall,
        "has_handwritten_content": udr.has_handwritten_content,
        "uncertain_fields_count": udr.uncertain_fields_count,
        "uncertain_fields": [u.to_dict() for u in udr.uncertain_fields],
        "tables_summary": [t.to_dict() for t in udr.tables],
        "extraction_log": udr.extraction_log,
        "columns": col_metadata.get("columns", []),
        "numeric_columns": col_metadata.get("numeric_columns", []),
        "categorical_columns": col_metadata.get("categorical_columns", []),
        "datetime_columns": col_metadata.get("datetime_columns", []),
        "id_columns": col_metadata.get("id_columns", []),
        "sample_rows": sample_rows,
        "health": quality_report
    }

    job_store.register_dataset(
        dataset_id=primary_dataset_id,
        data=dataset_record,
        tenant_id=current_user.tenant_id
    )

    return DatasetUploadResponse(
        dataset_id=primary_dataset_id,
        filename=main_filename,
        file_size_bytes=total_size_bytes,
        row_count=row_count,
        column_count=col_count,
        file_format=main_format,
        file_type=udr.file_type,
        total_files_count=len(saved_paths),
        files_summary=files_summary,
        total_pages=udr.total_pages,
        tables_extracted=len(udr.tables),
        extraction_confidence=udr.extraction_confidence_overall,
        has_handwritten_content=udr.has_handwritten_content,
        uncertain_fields_count=udr.uncertain_fields_count,
        uncertain_fields=[u.to_dict() for u in udr.uncertain_fields],
        tables_summary=[t.to_dict() for t in udr.tables],
        extraction_log=udr.extraction_log,
        columns=col_metadata.get("columns", []),
        numeric_columns=col_metadata.get("numeric_columns", []),
        categorical_columns=col_metadata.get("categorical_columns", []),
        datetime_columns=col_metadata.get("datetime_columns", []),
        id_columns=col_metadata.get("id_columns", []),
        sample_rows=sample_rows,
        health=quality_report,
        message=f"Ingested {len(saved_paths)} document(s) successfully ({udr.file_type}). {len(udr.tables)} table(s) extracted across {udr.total_pages} page(s)."
    )


@router.post("/upload/batch", response_model=DatasetUploadResponse)
async def upload_dataset_batch(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Dedicated batch upload endpoint for multiple files.
    """
    return await upload_dataset(files=files, background_tasks=background_tasks, current_user=current_user)


@router.post("/investigate")
async def start_investigation(
    payload: InvestigationJobCreate,
    background_tasks: BackgroundTasks,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Trigger the 8-agent investigation pipeline for a given uploaded dataset or document bundle.
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


@router.get("/dataset/{dataset_id}")
async def get_dataset_metadata(
    dataset_id: str,
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """
    Fetch stored dataset metadata, column catalog, and initial health score.
    """
    ds = job_store.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    verify_tenant_access(current_user, ds.get("tenant_id"))
    return ds
