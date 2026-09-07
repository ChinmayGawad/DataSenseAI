"""
API Integration Tests for Why? Engine Endpoints:
Tests /api/why/investigate, /api/why/{job_id}, /api/why/counterfactual, /api/why/compare, and /api/why/{job_id}/evidence/{node_id}.
"""

from pathlib import Path
import sys
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR / "backend"))
sys.path.append(str(ROOT_DIR / "core-ml"))

from app.main import app
from app.services.job_store import job_store

client = TestClient(app)


@pytest.fixture
def setup_test_dataset():
    csv_path = ROOT_DIR / "datasets" / "retail_sales.csv"
    with open(csv_path, "rb") as f:
        res = client.post("/api/upload", files={"file": ("retail_sales.csv", f, "text/csv")})
    assert res.status_code == 200
    upload_data = res.json()
    dataset_id = upload_data["dataset_id"]

    # Trigger investigation
    res_inv = client.post("/api/investigate", json={"dataset_id": dataset_id})
    assert res_inv.status_code == 200
    job_id = res_inv.json()["job_id"]
    return job_id


def test_why_engine_endpoints(setup_test_dataset):
    job_id = setup_test_dataset

    # 1. Test POST /api/why/investigate
    res = client.post("/api/why/investigate", json={
        "job_id": job_id,
        "target_metric": "Sales",
        "time_column": "Order_Date",
        "max_depth": 3,
        "min_contribution": 10.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["target_metric"] == "Sales"
    assert "root_cause_tree" in data
    assert "dataset_fingerprint" in data
    assert "competing_hypotheses" in data
    assert data["evidence_score"] > 0

    # 2. Test GET /api/why/{job_id}
    res_get = client.get(f"/api/why/{job_id}")
    assert res_get.status_code == 200
    assert res_get.json()["job_id"] == job_id

    # 3. Test POST /api/why/counterfactual
    res_cf = client.post("/api/why/counterfactual", json={
        "job_id": job_id,
        "target_metric": "Sales",
        "driver_dimension": "Region",
        "driver_segment": "West",
        "baseline_value": 5000.0,
        "current_value": 3000.0,
        "observed_total": 20000.0,
        "simulated_recovery_pct": 100.0
    })
    assert res_cf.status_code == 200
    cf_data = res_cf.json()
    assert cf_data["counterfactual_total"] == 22000.0
    assert cf_data["estimated_difference_abs"] == 2000.0
    assert "narrative_explanation" in cf_data

    # 4. Test POST /api/why/compare
    res_comp = client.post("/api/why/compare", json={
        "job_id_a": job_id,
        "job_id_b": job_id,
        "label_a": "Period A",
        "label_b": "Period B"
    })
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "success"

    # 5. Test GET /api/why/{job_id}/evidence/root
    res_ev = client.get(f"/api/why/{job_id}/evidence/root")
    assert res_ev.status_code == 200
    ev_data = res_ev.json()
    assert ev_data["node_id"] == "root"
    assert "step_by_step_calculation" in ev_data
