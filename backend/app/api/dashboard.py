"""
Dashboard API endpoints.
Provides the self-designing dashboard JSON configuration containing Plotly specs,
fact-checked insights, summary KPI metrics, and cleaned dataset export.
"""

from fastapi import APIRouter, HTTPException, Query, Response
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
for p in [str(ROOT_DIR), str(ROOT_DIR / "harness"), str(ROOT_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from harness.exporters.data_exporter import export_cleaned_dataset, export_cleaning_audit_markdown
from ..schemas.dashboard import DashboardResponse
from ..services.job_store import job_store
from ..services.storage_service import storage_service
import cleaning_engine

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


@router.get("/export/{job_id}")
async def export_dataset_endpoint(
    job_id: str,
    format: str = Query("csv", description="Export format: csv, json, parquet, markdown")
):
    """
    Downloads the cleaned, standardized dataset or the markdown cleaning audit trail.
    """
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    dataset_info = job_store.get_dataset(job["dataset_id"])
    if not dataset_info or not dataset_info.get("file_path"):
        raise HTTPException(status_code=404, detail="Dataset file not found")

    file_path = Path(dataset_info["file_path"])
    raw_df = storage_service.load_dataframe(file_path)
    clean_df, cleaning_info = cleaning_engine.clean_dataset(raw_df)

    clean_filename = Path(dataset_info.get("filename", "dataset.csv")).stem
    fmt = format.lower()

    if fmt in ["markdown", "audit", "md"]:
        audit_md = export_cleaning_audit_markdown(cleaning_info, dataset_name=clean_filename)
        return Response(
            content=audit_md,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="datasense_{clean_filename}_audit.md"'}
        )
    elif fmt == "json":
        json_bytes = export_cleaned_dataset(clean_df, export_format="json")
        return Response(
            content=json_bytes,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="datasense_{clean_filename}_cleaned.json"'}
        )
    elif fmt == "parquet":
        parquet_bytes = export_cleaned_dataset(clean_df, export_format="parquet")
        return Response(
            content=parquet_bytes,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="datasense_{clean_filename}_cleaned.parquet"'}
        )
    else:
        # Default CSV
        csv_bytes = export_cleaned_dataset(clean_df, export_format="csv")
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="datasense_{clean_filename}_cleaned.csv"'}
        )
