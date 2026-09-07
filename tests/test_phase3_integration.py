"""
Phase 3 Full-Stack Integration Test Suite.
Tests the complete end-to-end integration: File Upload -> 8-Agent Harness Execution ->
Dashboard Hydration -> Deep Dive Drilldown -> Cleaned Data Export -> Conversational Query Answering.
"""

import sys
import unittest
from pathlib import Path

# Setup paths
WORKSPACE_DIR = Path(__file__).resolve().parent.parent
for p in [str(WORKSPACE_DIR), str(WORKSPACE_DIR / "backend"), str(WORKSPACE_DIR / "harness"), str(WORKSPACE_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.services.storage_service import storage_service
from backend.app.services.job_store import job_store
from backend.app.services.pipeline_runner import execute_investigation_pipeline
from harness.adapter import drilldown_finding, query_dataset
from harness.exporters.data_exporter import export_cleaned_dataset, export_cleaning_audit_markdown


class TestPhase3Integration(unittest.TestCase):

    def setUp(self):
        self.retail_csv = WORKSPACE_DIR / "tests" / "sample_retail_sales.csv"
        self.assertTrue(self.retail_csv.exists(), "Sample retail dataset must exist")

    def test_end_to_end_phase3_lifecycle(self):
        print("\n=== Phase 3 Integration: Running Full Lifecycle ===")

        # 1. Simulate File Upload & Ingestion
        file_bytes = self.retail_csv.read_bytes()
        dataset_id, file_path, file_size = storage_service.save_file(file_bytes, "sample_retail_sales.csv")
        self.assertIsNotNone(dataset_id)
        print(f"Step 1: Ingested dataset '{dataset_id}' ({file_size} bytes).")

        job_store.register_dataset(dataset_id, {
            "dataset_id": dataset_id,
            "filename": "sample_retail_sales.csv",
            "file_path": str(file_path),
            "file_size": file_size,
            "row_count": 31,
            "column_count": 8,
            "format": "csv"
        })

        # 2. Trigger 8-Agent Investigation Pipeline
        job_id = job_store.create_job(dataset_id)
        dashboard = execute_investigation_pipeline(
            job_id=job_id,
            file_path=file_path,
            filename="sample_retail_sales.csv"
        )
        print(f"Step 2: Pipeline executed across 8 agents -> Job ID: {job_id}")

        # 3. Verify Job Status & Timeline Logs
        job = job_store.get_job(job_id)
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["progress_percentage"], 100)
        self.assertGreaterEqual(len(job["logs"]), 8)
        print(f"Step 3: Timeline verified with {len(job['logs'])} agent execution logs.")

        # 4. Verify Dashboard Payload & Data Profile Hydration
        self.assertEqual(dashboard["job_id"], job_id)
        self.assertGreater(len(dashboard["summary_cards"]), 0)
        self.assertGreater(len(dashboard["charts"]), 0)
        self.assertGreater(len(dashboard["insights"]), 0)
        self.assertGreater(len(dashboard["columns"]), 0)
        self.assertIn("quality_report", dashboard)
        self.assertIn("cleaning_summary", dashboard)

        cleaning = dashboard["cleaning_summary"]
        self.assertIn("missing_values_imputed", cleaning)
        self.assertIn("duplicates_removed", cleaning)
        self.assertIn("format_issues_fixed", cleaning)
        print(f"Step 4: Dashboard verified: {len(dashboard['charts'])} charts, {len(dashboard['insights'])} insights, {len(dashboard['columns'])} column catalog items.")

        # 5. Verify "Investigate This Finding" Drilldown
        drilldown_res = drilldown_finding(
            dataset_path=str(file_path),
            finding_type="anomaly",
            target_id=0
        )
        self.assertEqual(drilldown_res["finding_type"], "anomaly")
        self.assertIn("top_drivers", drilldown_res)
        self.assertIn("chart", drilldown_res)
        print(f"Step 5: Drilldown verified: {drilldown_res['executive_headline']}")

        # 6. Verify Conversational "Ask Dataset" Query Answering
        q_res = query_dataset(
            dataset_path=str(file_path),
            question="Which Region has the highest total Sales?"
        )
        self.assertEqual(q_res["status"], "success")
        self.assertEqual(q_res["fact_check"]["status"], "verified")
        self.assertIn("North", q_res["answer"])
        print(f"Step 6: Conversational query verified: '{q_res['answer']}'")

        # 7. Verify Cleaned Dataset Export
        raw_df = storage_service.load_dataframe(file_path)
        csv_bytes = export_cleaned_dataset(raw_df, "csv")
        self.assertGreater(len(csv_bytes), 100)
        audit_md = export_cleaning_audit_markdown(cleaning, "Retail Sales")
        self.assertIn("Automated Cleaning Audit Trail", audit_md)
        print(f"Step 7: Real export verified: {len(csv_bytes)} bytes CSV + Markdown audit generated.")

        # 8. Verify FastAPI Endpoints via TestClient (/api/query and /api/evaluation/scorecard)
        from fastapi.testclient import TestClient
        from backend.app.main import app

        client = TestClient(app)

        # Test POST /api/query
        q_resp = client.post("/api/query", json={
            "job_id": job_id,
            "question": "What is the total sales amount in INR?"
        })
        self.assertEqual(q_resp.status_code, 200)
        q_data = q_resp.json()
        self.assertEqual(q_data["status"], "success")
        self.assertIn("answer", q_data)
        print(f"Step 8a: POST /api/query verified -> '{q_data['answer']}'")

        # Test GET /api/evaluation/scorecard
        eval_resp = client.get("/api/evaluation/scorecard")
        self.assertEqual(eval_resp.status_code, 200)
        eval_data = eval_resp.json()
        self.assertEqual(eval_data["status"], "success")
        self.assertIn("scorecard_markdown", eval_data)
        self.assertIn("metrics_seal", eval_data)
        self.assertEqual(eval_data["metrics_seal"]["fact_check_accuracy"], 100.0)
        print(f"Step 8b: GET /api/evaluation/scorecard verified -> {eval_data['metrics_seal']}")

        print("=== Phase 3 Integration: ALL STEPS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    unittest.main()

