"""
Advanced Capabilities & Stress Testing Suite for DeepSeek Harness Engine.
Tests drilldown investigations, conversational querying, SSE streaming, and adversarial dirty datasets.
"""

import os
import sys
import unittest
from pathlib import Path

WORKSPACE_DIR = Path(__file__).resolve().parent.parent
for p in [str(WORKSPACE_DIR), str(WORKSPACE_DIR / "harness"), str(WORKSPACE_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from harness.adapter import (
    run_investigation_sync,
    stream_investigation_events_sync,
    drilldown_finding,
    query_dataset,
)
from harness.exporters.data_exporter import export_cleaned_dataset, export_cleaning_audit_markdown


class TestAdvancedCapabilities(unittest.TestCase):

    def setUp(self):
        self.retail_csv = str(WORKSPACE_DIR / "tests" / "sample_retail_sales.csv")
        self.dirty_csv = str(WORKSPACE_DIR / "tests" / "sample_dirty_ecommerce.csv")
        self.sparse_csv = str(WORKSPACE_DIR / "tests" / "sample_sparse_telecom.csv")

    def test_01_drilldown_anomaly(self):
        """Test 'Investigate This Finding' on an anomaly observation."""
        res = drilldown_finding(self.retail_csv, finding_type="anomaly", target_id=0)
        self.assertEqual(res["finding_type"], "anomaly")
        self.assertEqual(res["investigation_status"], "completed")
        self.assertIn("top_drivers", res)
        self.assertGreater(len(res["top_drivers"]), 0)
        self.assertIn("chart", res)
        self.assertIn("narrative", res)

    def test_02_drilldown_cluster(self):
        """Test 'Investigate This Finding' on a cluster cohort."""
        res = drilldown_finding(self.retail_csv, finding_type="cluster", target_id=0)
        self.assertEqual(res["finding_type"], "cluster")
        self.assertEqual(res["investigation_status"], "completed")
        self.assertIn("top_differentiating_traits", res)
        self.assertIn("chart", res)

    def test_03_drilldown_correlation(self):
        """Test 'Investigate This Finding' on correlation sub-groups."""
        res = drilldown_finding(
            self.retail_csv,
            finding_type="correlation",
            context={"column_a": "Sales", "column_b": "Profit", "dimension": "Region"}
        )
        self.assertEqual(res["finding_type"], "correlation")
        self.assertIn("subgroup_correlations", res)
        self.assertGreater(len(res["subgroup_correlations"]), 0)

    def test_04_ask_dataset_natural_query(self):
        """Test natural language querying against dataset."""
        # Query 1: Aggregation leader
        q1 = query_dataset(self.retail_csv, "Which Region generated the highest total Sales?")
        self.assertEqual(q1["status"], "success")
        self.assertEqual(q1["fact_check"]["status"], "verified")
        self.assertIn("North", q1["answer"])

        # Query 2: Metric calculation
        q2 = query_dataset(self.retail_csv, "What is the average Profit?")
        self.assertEqual(q2["status"], "success")
        self.assertEqual(q2["fact_check"]["status"], "verified")
        self.assertGreater(q2["fact_check"]["verified_value"], 0.0)

    def test_05_sse_streaming_adapter(self):
        """Test Server-Sent Events generator for real-time frontend timeline updates."""
        sse_generator = stream_investigation_events_sync(self.retail_csv)
        chunks = list(sse_generator)
        self.assertGreaterEqual(len(chunks), 10)
        self.assertTrue(any('"type": "complete"' in c for c in chunks))

    def test_06_dirty_ecommerce_resilience(self):
        """Test pipeline against messy formatting, currency symbols, and multi-format dates."""
        res = run_investigation_sync(self.dirty_csv)
        self.assertEqual(res["status"], "success")
        self.assertGreater(res["summary"]["total_rows_cleaned"], 0)
        self.assertGreater(len(res["verified_insights"]), 0)

    def test_07_sparse_telecom_resilience(self):
        """Test pipeline against high-null sparse columns and zero-variance features."""
        res = run_investigation_sync(self.sparse_csv)
        self.assertEqual(res["status"], "success")
        # Quality report should catch constant column and sparse column
        self.assertIn("Constant_Code", res["quality"]["constant_columns"])
        self.assertGreater(len(res["charts"]), 1)

    def test_08_export_and_audit_generation(self):
        """Test CSV/Parquet export and Markdown audit generation."""
        res = run_investigation_sync(self.retail_csv)
        audit_md = export_cleaning_audit_markdown(res["cleaning"], dataset_name="Retail Sales")
        self.assertIn("Automated Cleaning Audit Trail", audit_md)
        self.assertIn("Transformation Log", audit_md)


if __name__ == "__main__":
    unittest.main()
