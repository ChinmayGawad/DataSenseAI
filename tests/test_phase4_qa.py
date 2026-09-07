"""
Phase 4: Comprehensive QA, Edge-Case & DeepSeek Harness Simultaneous Verification Suite.
Tests edge-case resilience, boundary conditions, zero-variance handling,
conversational query robustness with Indian standards, and the 5 Smart Rule chart mappings.
"""

import sys
import tempfile
import unittest
import pandas as pd
import numpy as np
from pathlib import Path

# Setup paths
WORKSPACE_DIR = Path(__file__).resolve().parent.parent
for p in [str(WORKSPACE_DIR), str(WORKSPACE_DIR / "backend"), str(WORKSPACE_DIR / "harness"), str(WORKSPACE_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from harness.workflows.investigation_pipeline import run_investigation_pipeline
from harness.agents.query_assistant import answer_dataset_question
from harness.plugins.chart_tools import build_dashboard_charts
from column_inspector import detect_column_types
from quality_inspector import inspect_data_quality
from cleaning_engine import clean_dataset
from statistical_engine import generate_summary_stats, calculate_correlations
from backend.app.services.indian_standards import format_inr, format_indian_number, format_indian_date


class TestPhase4QualityAssurance(unittest.TestCase):

    def setUp(self):
        self.temp_path = WORKSPACE_DIR / "tests" / "temp_qa_dir"
        self.temp_path.mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        if self.temp_path.exists():
            for f in self.temp_path.glob("*.csv"):
                try:
                    f.unlink()
                except Exception:
                    pass

    def _save_df_to_csv(self, df: pd.DataFrame, name: str = "test.csv") -> Path:
        p = self.temp_path / name
        df.to_csv(p, index=False)
        return p

    def test_01_single_row_dataset_resilience(self):
        """Verify pipeline handles a minimal 1-row dataset without division-by-zero or crashes."""
        df = pd.DataFrame({
            "Transaction_ID": ["TXN-001"],
            "Date": ["2024-01-15"],
            "City": ["Mumbai"],
            "Sales_INR": [54000.0],
            "Profit_INR": [12000.0],
        })
        csv_file = self._save_df_to_csv(df, "single_row.csv")

        events = []
        result = run_investigation_pipeline(
            file_path=str(csv_file),
            event_callback=lambda e: events.append(e)
        )

        self.assertEqual(result["status"], "success")
        self.assertGreaterEqual(len(events), 5)
        self.assertEqual(result["summary"]["total_rows_original"], 1)
        self.assertIn("verified_insights", result)

    def test_02_all_categorical_dataset_resilience(self):
        """Verify pipeline gracefully handles datasets with zero numeric columns."""
        df = pd.DataFrame({
            "User_ID": [f"USR-{i}" for i in range(20)],
            "Region": ["North", "South", "East", "West"] * 5,
            "Tier": ["Gold", "Silver", "Platinum", "Bronze"] * 5,
            "Status": ["Active", "Inactive"] * 10,
        })
        csv_file = self._save_df_to_csv(df, "all_categorical.csv")

        result = run_investigation_pipeline(file_path=str(csv_file))
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["ml_findings"]["correlations"]), 0)

    def test_03_constant_column_variance_guards(self):
        """Verify zero-variance columns do not throw runtime warnings or NaN correlation crashes."""
        df = pd.DataFrame({
            "ID": [f"ID-{i}" for i in range(30)],
            "Constant_Price": [100.0] * 30,  # Zero variance
            "Variable_Units": list(range(30)),
            "Another_Constant": [50.0] * 30,  # Zero variance
        })
        csv_file = self._save_df_to_csv(df, "constant_cols.csv")

        corrs = calculate_correlations(df)
        self.assertFalse(corrs["has_sufficient_data"])

        result = run_investigation_pipeline(file_path=str(csv_file))
        self.assertEqual(result["status"], "success")

    def test_04_extreme_missingness_handling(self):
        """Verify 95% missing value saturation is calibrated in health score and cleaned safely."""
        n = 40
        df = pd.DataFrame({
            "Record_ID": [f"REC-{i}" for i in range(n)],
            "Sparse_Feature_1": [None if i > 2 else i * 50 for i in range(n)],  # 95% null
            "Sparse_Feature_2": [None if i > 1 else "Present" for i in range(n)], # 95% null
            "Revenue_INR": [1000.0 + i * 10 for i in range(n)],
        })
        csv_file = self._save_df_to_csv(df, "high_nulls.csv")

        result = run_investigation_pipeline(file_path=str(csv_file))
        self.assertEqual(result["status"], "success")
        health = result["quality"]["health_score"]
        self.assertLess(health, 90.0, "Health score must reflect severe missingness penalty")
        self.assertGreater(result["cleaning"]["total_actions"], 0)

    def test_05_conversational_query_assistant_robustness(self):
        """Verify Ask AI answers plain-English questions with Indian currency formatting."""
        df = pd.DataFrame({
            "Store_ID": [f"STR-{i}" for i in range(25)],
            "City": ["Delhi", "Bengaluru", "Mumbai", "Kolkata", "Chennai"] * 5,
            "Sales_INR": [15000.0 + (i * 2500.0) for i in range(25)],
            "Units_Sold": [i + 5 for i in range(25)],
        })
        csv_file = self._save_df_to_csv(df, "retail_query.csv")

        # 1. Direct aggregation query
        q1 = answer_dataset_question(str(csv_file), "What is the total Sales_INR in Delhi?")
        self.assertEqual(q1["status"], "success")
        self.assertIn("fact_check", q1)
        self.assertEqual(q1["fact_check"]["status"], "verified")

        # 2. Maximum entity query
        q2 = answer_dataset_question(str(csv_file), "Which City has the highest Sales_INR?")
        self.assertEqual(q2["status"], "success")
        self.assertIn("Chennai", q2["answer"])

    def test_06_smart_rule_chart_selection_engine(self):
        """Verify that the 5 Smart Decision Rules produce correct Plotly specifications."""
        df = pd.DataFrame({
            "Transaction_Date": pd.date_range("2024-01-01", periods=20, freq="D"),
            "Category": ["Electronics", "Apparel", "Home", "Books"] * 5,
            "Revenue_INR": [5000.0 + i * 400 for i in range(20)],
            "Profit_INR": [1000.0 + i * 150 for i in range(20)],
            "Quantity": [i % 5 + 1 for i in range(20)],
        })

        col_info = {
            "datetime_columns": ["Transaction_Date"],
            "categorical_columns": ["Category"],
            "numeric_columns": ["Revenue_INR", "Profit_INR", "Quantity"]
        }
        ml_results = {
            "correlations": {
                "strong_correlations": [
                    {"column_a": "Revenue_INR", "column_b": "Profit_INR", "coefficient": 0.98, "direction": "positive", "strength": "very strong"}
                ],
                "matrix": df[["Revenue_INR", "Profit_INR", "Quantity"]].corr().to_dict()
            },
            "clustering": {"has_sufficient_data": False}
        }

        charts = build_dashboard_charts(df, col_info, ml_results)
        chart_rules = [c.get("decision_rule") for c in charts]

        # Verify all 5 rules are mapped
        self.assertIn("Date + Numeric → Line Chart", chart_rules)
        self.assertIn("Category + Numeric → Bar Chart", chart_rules)
        self.assertIn("Numeric + Numeric → Scatter Plot", chart_rules)
        self.assertIn("Single Numeric Variable → Histogram", chart_rules)
        self.assertIn("Multiple Numeric Variables → Heatmap Matrix", chart_rules)

    def test_07_indian_standards_formatting_fidelity(self):
        """Verify Indian numbering, currency symbols (₹), and date notation (DD/MM/YYYY)."""
        # 1. Rupee formatting
        self.assertEqual(format_inr(128430), "₹1,28,430")
        self.assertEqual(format_inr(1420000, compact=True), "₹14.20 L")
        self.assertEqual(format_inr(12500000, compact=True), "₹1.25 Cr")

        # 2. Indian comma notation (2,2,3)
        self.assertEqual(format_indian_number(100000), "1,00,000")
        self.assertEqual(format_indian_number(12345678), "1,23,45,678")

        # 3. Date notation
        self.assertEqual(format_indian_date("2024-01-15"), "15/01/2024")


if __name__ == "__main__":
    unittest.main()
