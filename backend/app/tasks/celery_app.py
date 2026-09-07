"""
DataSense AI - Celery Application Configuration & Distributed Worker Tasks.
Enables horizontal scaling of multi-agent investigations across multiple worker nodes.
"""

from pathlib import Path
import sys
from celery import Celery
from ..config import settings

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
for p in [str(ROOT_DIR), str(ROOT_DIR / "harness"), str(ROOT_DIR / "core-ml"), str(ROOT_DIR / "backend")]:
    if p not in sys.path:
        sys.path.insert(0, p)

celery_app = Celery(
    "datasense_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per investigation
)


@celery_app.task(name="tasks.execute_investigation", bind=True)
def celery_investigation_task(self, job_id: str, file_path_str: str, filename: str, tenant_id: str = "default_tenant"):
    """
    Celery background worker task for running the autonomous multi-agent pipeline.
    """
    from ..services.pipeline_runner import execute_investigation_pipeline
    return execute_investigation_pipeline(
        job_id=job_id,
        file_path=Path(file_path_str),
        filename=filename
    )
