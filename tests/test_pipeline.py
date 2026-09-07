"""
Phase 1 Integration Test: Tests core-ml algorithms, pipeline execution,
and FastAPI endpoint contracts against practice datasets.
"""

import sys
from pathlib import Path
import pytest

# Add paths
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR / "core-ml"))
sys.path.append(str(ROOT_DIR / "backend"))

import pandas as pd
from column_inspector import detect_column_types
from quality_inspector import inspect_data_quality
from cleaning_engine import clean_dataset
from statistical_engine import generate_summary_stats, calculate_correlations
from anomaly_detector import detect_outliers
from clustering_engine import run_clustering
from app.services.pipeline_runner import execute_investigation_pipeline
from app.services.job_store import job_store
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_core_ml_engines():
    csv_path = ROOT_DIR / "datasets" / "retail_sales.csv"
    df = pd.read_csv(csv_path)

    # 1. Type Detection
    types = detect_column_types(df)
    assert types["total_columns"] == 8
    assert "Sales" in types["numeric_columns"]
    assert "Region" in types["categorical_columns"]
    assert "Order_Date" in types["datetime_columns"]
    assert "Order_ID" in types["id_columns"]

    # 2. Quality Audit
    quality = inspect_data_quality(df)
    assert quality["duplicate_rows_count"] >= 1
    assert quality["health_score"] > 0
    assert quality["health_score"] <= 100

    # 3. Cleaning
    cleaned_df, clean_report = clean_dataset(df)
    assert clean_report["duplicates_removed"] >= 1
    assert cleaned_df["Sales"].isna().sum() == 0

    # 4. Statistics & Correlations
    stats = generate_summary_stats(cleaned_df)
    assert "Sales" in stats["numeric_stats"]
    corrs = calculate_correlations(cleaned_df)
    assert corrs["has_sufficient_data"] is True

    # 5. Outliers & Clustering
    outliers = detect_outliers(cleaned_df)
    assert "total_outliers" in outliers
    clusters = run_clustering(cleaned_df)
    assert clusters["k"] >= 2
    print("All core-ml assertions passed!")


def test_api_endpoints():
    csv_path = ROOT_DIR / "datasets" / "retail_sales.csv"
    
    # 1. Test Health
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. Test Upload
    with open(csv_path, "rb") as f:
        res = client.post("/api/upload", files={"file": ("retail_sales.csv", f, "text/csv")})
    assert res.status_code == 200
    upload_data = res.json()
    dataset_id = upload_data["dataset_id"]
    assert dataset_id is not None
    assert upload_data["row_count"] > 0

    # 3. Test Investigation Trigger
    res = client.post("/api/investigate", json={"dataset_id": dataset_id})
    assert res.status_code == 200
    job_id = res.json()["job_id"]
    assert job_id is not None

    # Wait or check status
    res = client.get(f"/api/status/{job_id}")
    assert res.status_code == 200
    status_data = res.json()
    assert "status" in status_data
    assert len(status_data["logs"]) > 0

    # Wait until pipeline completes
    import time
    for _ in range(10):
        res = client.get(f"/api/status/{job_id}")
        if res.json()["status"] == "completed":
            break
        time.sleep(0.5)

    assert res.json()["status"] == "completed"

    # 4. Test Dashboard Config
    res = client.get(f"/api/dashboard/{job_id}")
    assert res.status_code == 200
    dashboard = res.json()
    assert len(dashboard["summary_cards"]) >= 4
    assert len(dashboard["charts"]) >= 2
    assert len(dashboard["insights"]) >= 2
    assert dashboard["health_score"] > 0

    # 5. Test Drilldown
    first_insight_id = dashboard["insights"][0]["id"]
    res = client.post("/api/drilldown", json={"job_id": job_id, "finding_id": first_insight_id})
    assert res.status_code == 200
    drilldown = res.json()
    assert drilldown["finding_id"] == first_insight_id
    assert len(drilldown["evidence_points"]) > 0

    print("All API endpoint contract assertions passed!")


if __name__ == "__main__":
    test_core_ml_engines()
    test_api_endpoints()
    print("SUCCESS: Phase 1 tests completely verified.")
