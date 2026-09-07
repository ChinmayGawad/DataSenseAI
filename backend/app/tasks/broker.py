"""
DataSense AI - Pluggable Job Queue Broker.
Provides a resilient dual-mode dispatcher:
- Local FastAPI BackgroundTasks (default, zero-config, single-node development & hackathons)
- Distributed Celery + Redis Queue (multi-worker cluster scaling for cloud production)
"""

import logging
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import BackgroundTasks
from ..config import settings
from ..services.pipeline_runner import execute_investigation_pipeline

logger = logging.getLogger("datasense.tasks.broker")


class JobQueueBroker:
    """
    Abstracts task queuing between local single-node background execution
    and distributed Celery multi-worker clusters.
    """

    @staticmethod
    def dispatch_investigation_job(
        job_id: str,
        file_path: Path,
        filename: str,
        tenant_id: str = "default_tenant",
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Dict[str, Any]:
        """
        Dispatches an investigation job to either Celery or local BackgroundTasks.
        Gracefully falls back to local background runner if Celery broker is unreachable.
        """
        if settings.WORKER_MODE == "celery":
            try:
                from .celery_app import celery_investigation_task
                task_async = celery_investigation_task.delay(
                    job_id=job_id,
                    file_path_str=str(file_path),
                    filename=filename,
                    tenant_id=tenant_id
                )
                return {
                    "mode": "celery",
                    "task_id": task_async.id,
                    "status": "queued_to_celery",
                    "worker_cluster": settings.REDIS_URL
                }
            except Exception as e:
                logger.warning(
                    f"Failed to dispatch to Celery cluster ({str(e)}). Falling back to local BackgroundTasks."
                )

        # Default local FastAPI BackgroundTasks mode
        if background_tasks:
            background_tasks.add_task(
                execute_investigation_pipeline,
                job_id=job_id,
                file_path=file_path,
                filename=filename
            )
            return {
                "mode": "background_tasks",
                "status": "queued_locally",
                "worker_cluster": "local"
            }
        else:
            # Synchronous or thread fallback if no background_tasks passed
            execute_investigation_pipeline(job_id=job_id, file_path=file_path, filename=filename)
            return {
                "mode": "synchronous",
                "status": "completed_inline",
                "worker_cluster": "local"
            }


job_broker = JobQueueBroker()
