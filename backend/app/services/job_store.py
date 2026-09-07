"""
Job Store: Manages investigation jobs, agent logs, datasets, and generated dashboards.
Supports multi-tenant isolation, memory store for rapid local evaluation,
and pluggable Redis cache/storage for distributed worker clusters.
"""

import json
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone
from ..config import settings


class JobStore:
    def __init__(self):
        self.datasets: Dict[str, Dict[str, Any]] = {}
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.dashboards: Dict[str, Dict[str, Any]] = {}
        self.why_analyses: Dict[str, Dict[str, Any]] = {}
        self._redis_client = None

        if settings.USE_REDIS_STORE:
            try:
                import redis
                self._redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                self._redis_client.ping()
            except Exception:
                self._redis_client = None

    def register_dataset(self, dataset_id: str, data: Dict[str, Any], tenant_id: str = "default_tenant") -> None:
        payload = {
            **data,
            "tenant_id": tenant_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self.datasets[dataset_id] = payload

        if self._redis_client:
            try:
                key = f"datasense:{tenant_id}:dataset:{dataset_id}"
                self._redis_client.set(key, json.dumps(payload, default=str), ex=86400 * 7)
            except Exception:
                pass

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        # First check memory
        if dataset_id in self.datasets:
            return self.datasets[dataset_id]

        if self._redis_client:
            try:
                # Scan for dataset across tenants
                keys = self._redis_client.keys(f"datasense:*:dataset:{dataset_id}")
                if keys:
                    val = self._redis_client.get(keys[0])
                    if val:
                        parsed = json.loads(val)
                        self.datasets[dataset_id] = parsed
                        return parsed
            except Exception:
                pass

        return None

    def create_job(self, dataset_id: str, tenant_id: str = "default_tenant") -> str:
        job_id = str(uuid.uuid4())
        job_data = {
            "job_id": job_id,
            "dataset_id": dataset_id,
            "tenant_id": tenant_id,
            "status": "queued",
            "current_agent": None,
            "progress_percentage": 0,
            "health_score": None,
            "summary": None,
            "error_message": None,
            "logs": [],
            "plan": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.jobs[job_id] = job_data

        if self._redis_client:
            try:
                key = f"datasense:{tenant_id}:job:{job_id}"
                self._redis_client.set(key, json.dumps(job_data, default=str), ex=86400 * 3)
            except Exception:
                pass

        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id in self.jobs:
            return self.jobs[job_id]

        if self._redis_client:
            try:
                keys = self._redis_client.keys(f"datasense:*:job:{job_id}")
                if keys:
                    val = self._redis_client.get(keys[0])
                    if val:
                        parsed = json.loads(val)
                        self.jobs[job_id] = parsed
                        return parsed
            except Exception:
                pass

        return None

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
        job = self.get_job(job_id)
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
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        job["logs"].append(log_item)
        job["current_agent"] = agent_name
        job["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self._redis_client:
            try:
                tenant_id = job.get("tenant_id", "default_tenant")
                key = f"datasense:{tenant_id}:job:{job_id}"
                self._redis_client.set(key, json.dumps(job, default=str), ex=86400 * 3)
            except Exception:
                pass

    def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: int,
        summary: Optional[str] = None,
        health_score: Optional[float] = None,
        error_message: Optional[str] = None,
    ) -> None:
        job = self.get_job(job_id)
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
        job["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self._redis_client:
            try:
                tenant_id = job.get("tenant_id", "default_tenant")
                key = f"datasense:{tenant_id}:job:{job_id}"
                self._redis_client.set(key, json.dumps(job, default=str), ex=86400 * 3)
            except Exception:
                pass

    def set_plan(self, job_id: str, plan_items: List[Dict[str, Any]]) -> None:
        job = self.get_job(job_id)
        if job:
            job["plan"] = plan_items
            job["updated_at"] = datetime.now(timezone.utc).isoformat()
            if self._redis_client:
                try:
                    tenant_id = job.get("tenant_id", "default_tenant")
                    key = f"datasense:{tenant_id}:job:{job_id}"
                    self._redis_client.set(key, json.dumps(job, default=str), ex=86400 * 3)
                except Exception:
                    pass

    def save_dashboard(self, job_id: str, dashboard_data: Dict[str, Any]) -> None:
        self.dashboards[job_id] = dashboard_data

        if self._redis_client:
            try:
                job = self.get_job(job_id)
                tenant_id = job.get("tenant_id", "default_tenant") if job else "default_tenant"
                key = f"datasense:{tenant_id}:dashboard:{job_id}"
                self._redis_client.set(key, json.dumps(dashboard_data, default=str), ex=86400 * 7)
            except Exception:
                pass

    def save_why_analysis(self, job_id: str, why_data: Dict[str, Any]) -> None:
        self.why_analyses[job_id] = why_data

        if self._redis_client:
            try:
                job = self.get_job(job_id)
                tenant_id = job.get("tenant_id", "default_tenant") if job else "default_tenant"
                key = f"datasense:{tenant_id}:why:{job_id}"
                self._redis_client.set(key, json.dumps(why_data, default=str), ex=86400 * 7)
            except Exception:
                pass

    def get_why_analysis(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id in self.why_analyses:
            return self.why_analyses[job_id]

        if self._redis_client:
            try:
                keys = self._redis_client.keys(f"datasense:*:why:{job_id}")
                if keys:
                    val = self._redis_client.get(keys[0])
                    if val:
                        parsed = json.loads(val)
                        self.why_analyses[job_id] = parsed
                        return parsed
            except Exception:
                pass

        return None

    def get_dashboard(self, job_id: str) -> Optional[Dict[str, Any]]:
        if job_id in self.dashboards:
            return self.dashboards[job_id]

        if self._redis_client:
            try:
                keys = self._redis_client.keys(f"datasense:*:dashboard:{job_id}")
                if keys:
                    val = self._redis_client.get(keys[0])
                    if val:
                        parsed = json.loads(val)
                        self.dashboards[job_id] = parsed
                        return parsed
            except Exception:
                pass

        return None


job_store = JobStore()
