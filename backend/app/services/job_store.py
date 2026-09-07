"""
Job Store: Manages in-memory state for active investigation jobs, agent logs,
and generated dashboards for low-latency streaming and API responses.
"""

from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone


class JobStore:
    def __init__(self):
        self.datasets: Dict[str, Dict[str, Any]] = {}
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.dashboards: Dict[str, Dict[str, Any]] = {}

    def register_dataset(self, dataset_id: str, data: Dict[str, Any]) -> None:
        self.datasets[dataset_id] = {
            **data,
            "created_at": datetime.now(timezone.utc)
        }

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        return self.datasets.get(dataset_id)

    def create_job(self, dataset_id: str) -> str:
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            "job_id": job_id,
            "dataset_id": dataset_id,
            "status": "queued",
            "current_agent": None,
            "progress_percentage": 0,
            "health_score": None,
            "summary": None,
            "error_message": None,
            "logs": [],
            "plan": [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    def add_agent_log(
        self,
        job_id: str,
        agent_name: str,
        agent_icon: str,
        step_title: str,
        description: str,
        status: str = "completed",
        details: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[int] = None,
    ) -> None:
        job = self.jobs.get(job_id)
        if not job:
            return

        log_item = {
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "agent_name": agent_name,
            "agent_icon": agent_icon,
            "step_title": step_title,
            "description": description,
            "status": status,
            "details": details or {},
            "duration_ms": duration_ms,
            "created_at": datetime.now(timezone.utc),
        }
        job["logs"].append(log_item)
        job["current_agent"] = agent_name
        job["updated_at"] = datetime.now(timezone.utc)

    def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: int,
        summary: Optional[str] = None,
        health_score: Optional[float] = None,
        error_message: Optional[str] = None,
    ) -> None:
        job = self.jobs.get(job_id)
        if not job:
            return

        job["status"] = status
        job["progress_percentage"] = progress
        if summary:
            job["summary"] = summary
        if health_score is not None:
            job["health_score"] = health_score
        if error_message:
            job["error_message"] = error_message
        job["updated_at"] = datetime.now(timezone.utc)

    def set_plan(self, job_id: str, plan_items: List[Dict[str, Any]]) -> None:
        job = self.jobs.get(job_id)
        if job:
            job["plan"] = plan_items
            job["updated_at"] = datetime.now(timezone.utc)

    def save_dashboard(self, job_id: str, dashboard_data: Dict[str, Any]) -> None:
        self.dashboards[job_id] = dashboard_data

    def get_dashboard(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.dashboards.get(job_id)


job_store = JobStore()
