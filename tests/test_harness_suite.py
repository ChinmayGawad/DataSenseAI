"""
Comprehensive Test Suite for DeepSeek Harness Multi-Agent Engine.
Tests all 8 specialized agents, deterministic core-ml facts, fact-checking accuracy, and end-to-end pipeline execution.
"""

import os
import sys
import unittest
from pathlib import Path

# Setup paths
WORKSPACE_DIR = Path(__file__).resolve().parent.parent
HARNESS_DIR = WORKSPACE_DIR / "harness"
CORE_ML_DIR = WORKSPACE_DIR / "core-ml"

for p in [str(WORKSPACE_DIR), str(HARNESS_DIR), str(CORE_ML_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from harness.workflows.investigation_pipeline import run_investigation_pipeline
from harness.plugins.data_tools import load_and_inspect_data
from harness.plugins.cleaning_tools import execute_data_cleaning
from harness.plugins.ml_tools import execute_statistical_and_ml_suite
from harness.plugins.chart_tools import build_dashboard_charts


class TestDeepSeekHarnessEngine(unittest.TestCase):

    def setUp(self):
        self.retail_csv = str(WORKSPACE_DIR / "tests" / "sample_retail_sales.csv")
        self.marketing_csv = str(WORKSPACE_DIR / "tests" / "sample_marketing_campaign.csv")
        self.healthcare_csv = str(WORKSPACE_DIR / "tests" / "sample_healthcare_data.csv")

    def test_01_retail_sales_pipeline(self):
        """Verify full 8-agent investigation on Retail Sales dataset."""
        print("\n--- Running Investigation on Retail Sales ---")
        result = run_investigation_pipeline(self.retail_csv)

        # 1. Pipeline status
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["summary"])
        
        # 2. Agent 1: Data Detective
        summary = result["summary"]
        self.assertIn("Commercial Sales", summary["domain"])
        self.assertGreater(summary["total_rows_original"], 0)
        self.assertGreater(summary["total_columns"], 0)

        # 3. Agent 2: Quality Inspector & Health Score
        health = result["quality"]["health_score"]
        self.assertGreaterEqual(health, 0.0)
        self.assertLessEqual(health, 100.0)
        print(f"Dataset Health Score: {health}/100 ({result['quality']['quality_grade']})")

        # 4. Agent 3: Cleaning Decisions
        cleaning = result["cleaning"]
        self.assertGreater(cleaning["total_actions"], 0)
        self.assertEqual(cleaning["duplicates_removed"], 1)  # There was 1 duplicate in retail
        print(f"Cleaning Actions: {cleaning['total_actions']} operations logged.")

        # 5. Agent 4: Investigation Plan
        plan = result["investigation_plan"]
        self.assertGreaterEqual(len(plan), 3)
        print(f"Investigation Steps: {len(plan)} hypotheses formulated.")

        # 6. Agent 5: ML & Stats
        ml = result["ml_findings"]
        self.assertIn("correlations", ml)
        self.assertIn("outlier_analysis", ml)
        self.assertIn("clustering_analysis", ml)
        print(f"ML Outliers Detected: {ml['outlier_analysis']['total_outliers']}")
        print(f"ML Clusters: k={ml['clustering_analysis']['k']}")

        # 7. Agent 6: Dynamic Charts
        charts = result["charts"]
        self.assertGreaterEqual(len(charts), 2)
        for c in charts:
            self.assertIn("why_chosen", c)
            self.assertIn("plotly_data", c)
            self.assertIn("plotly_layout", c)
        print(f"Dynamic Charts Generated: {len(charts)} charts with 'Why Chosen' rationale.")

        # 8. Agent 7 & 8: Verified Insights & Fact-Checking
        insights = result["verified_insights"]
        self.assertGreaterEqual(len(insights), 3)
        audit = result["fact_check_audit"]
        self.assertGreaterEqual(audit["accuracy_rate"], 90.0)
        print(f"Fact-Check Accuracy: {audit['accuracy_rate']}% ({audit['verified_count']} verified verbatim)")

        # 9. Timeline Trace
        timeline = result["timeline"]
        self.assertGreaterEqual(len(timeline), 8)
        print(f"Timeline Events: {len(timeline)} chronological agent events emitted.")

    def test_02_marketing_campaign_pipeline(self):
        """Verify pipeline execution on Marketing dataset."""
        print("\n--- Running Investigation on Marketing Campaign ---")
        result = run_investigation_pipeline(self.marketing_csv)
        self.assertEqual(result["status"], "success")
        self.assertGreaterEqual(result["summary"]["health_score"], 50.0)
        self.assertGreaterEqual(len(result["verified_insights"]), 3)

    def test_03_healthcare_pipeline(self):
        """Verify pipeline execution on Healthcare dataset."""
        print("\n--- Running Investigation on Healthcare Data ---")
        result = run_investigation_pipeline(self.healthcare_csv)
        self.assertEqual(result["status"], "success")
        self.assertGreaterEqual(len(result["charts"]), 2)
        self.assertEqual(result["fact_check_audit"]["accuracy_rate"], 100.0)


if __name__ == "__main__":
    unittest.main()
