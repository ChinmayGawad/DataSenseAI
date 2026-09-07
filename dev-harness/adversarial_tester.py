"""
DataSense AI - Dev Harness: Adversarial Stress Tester
Injects dirty edge cases and pathological data conditions to verify
agent robustness, error resilience, and graceful degradation across all 8 agents.
"""

import sys
import tempfile
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

ROOT_DIR = Path(__file__).resolve().parent.parent
for p in [str(ROOT_DIR), str(ROOT_DIR / "harness"), str(ROOT_DIR / "core-ml")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from harness.workflows.investigation_pipeline import run_investigation_pipeline


class AdversarialTester:
    def __init__(self):
        self.test_cases = [
            {
                "id": "extreme_outliers",
                "name": "10-Sigma Extreme Numerical Outliers",
                "generator": self._gen_extreme_outliers,
            },
            {
                "id": "high_null_density",
                "name": "90% Missing Value Saturation",
                "generator": self._gen_high_null_dataset,
            },
            {
                "id": "irregular_dates",
                "name": "Mixed & Malformed Date Encodings",
                "generator": self._gen_irregular_dates,
            },
            {
                "id": "mixed_types_and_nan_spam",
                "name": "Mixed Dtypes & Whitespace NaN Spam",
                "generator": self._gen_mixed_types,
            },
        ]

    def _gen_extreme_outliers(self) -> pd.DataFrame:
        np.random.seed(42)
        n = 50
        sales = np.random.normal(5000, 1000, n)
        # Inject 10-sigma extreme transactions
        sales[0] = 5000000.0  # ₹50 Lakhs outlier
        sales[1] = 99999999.0  # ₹10 Crore outlier
        return pd.DataFrame({
            "Transaction_ID": [f"TXN-{i:04d}" for i in range(n)],
            "Customer_Region": np.random.choice(["Mumbai", "Bengaluru", "Delhi NCR", "Kolkata"], n),
            "Sales_INR": sales,
            "Profit_INR": sales * np.random.uniform(0.1, 0.3, n),
            "Quantity": np.random.randint(1, 10, n),
        })

    def _gen_high_null_dataset(self) -> pd.DataFrame:
        n = 50
        df = pd.DataFrame({
            "User_ID": [f"USR-{i:03d}" for i in range(n)],
            "Sparse_Feature_A": [None if i > 5 else i * 10 for i in range(n)],  # 90% null
            "Sparse_Feature_B": [None if i > 3 else "High" for i in range(n)],    # 94% null
            "Active_Revenue": [1000.0 + i * 20 for i in range(n)],
            "Category": np.random.choice(["Electronics", "Clothing", "Grocery"], n),
        })
        return df

    def _gen_irregular_dates(self) -> pd.DataFrame:
        dates = [
            "15/01/2024", "2024-01-16", "17-Jan-2024", "2024/01/18",
            "19.01.2024", "2024-01-20T00:00:00", "invalid_date_entry", None
        ] * 6
        n = len(dates)
        return pd.DataFrame({
            "Invoice_No": [f"INV-{i:03d}" for i in range(n)],
            "Invoice_Date": dates,
            "Billing_Amount_INR": np.random.uniform(500, 15000, n),
            "Payment_Status": np.random.choice(["Paid", "Pending", "Failed"], n),
        })

    def _gen_mixed_types(self) -> pd.DataFrame:
        n = 40
        return pd.DataFrame({
            "Order_Code": [f"ORD-{i}" for i in range(n)],
            "Mixed_Amount": ["₹1,200", "3400.50", "N/A", "--", "Unknown", 4500.0, None] * 5 + ["1000"] * 5,
            "Customer_Feedback": ["Excellent", "Bad", "", "   ", "N/A", "Good"] * 6 + ["Average"] * 4,
            "Units_Sold": [i % 5 + 1 for i in range(n)],
        })

    def run_all_stress_tests(self) -> Dict[str, Any]:
        results = []
        for tc in self.test_cases:
            df = tc["generator"]()
            with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
                temp_path = Path(tmp.name)
                df.to_csv(temp_path, index=False)

            try:
                res = run_investigation_pipeline(file_path=temp_path)
                crashed = res.get("status") != "success"
                results.append({
                    "test_case_id": tc["id"],
                    "name": tc["name"],
                    "status": "passed" if not crashed else "failed",
                    "rows_tested": len(df),
                    "columns_tested": len(df.columns),
                    "pipeline_status": res.get("status"),
                    "handled_gracefully": not crashed,
                    "health_score": res.get("quality", {}).get("health_score", 0),
                    "cleaning_actions": res.get("cleaning", {}).get("total_actions", 0),
                    "error_message": res.get("error_message"),
                })
            except Exception as e:
                results.append({
                    "test_case_id": tc["id"],
                    "name": tc["name"],
                    "status": "failed",
                    "handled_gracefully": False,
                    "error_message": str(e),
                })
            finally:
                if temp_path.exists():
                    try:
                        temp_path.unlink()
                    except Exception:
                        pass

        all_handled = all(r.get("handled_gracefully", False) for r in results)
        passed_count = sum(1 for r in results if r.get("handled_gracefully", False))
        pass_rate = round((passed_count / max(len(self.test_cases), 1)) * 100, 1)
        return {
            "total_stress_tests": len(self.test_cases),
            "passed_stress_tests": passed_count,
            "pass_rate": pass_rate,
            "resilience_rate": f"{pass_rate}%",
            "zero_unhandled_exceptions": all_handled,
            "tests": results,
            "test_cases": results,
        }


if __name__ == "__main__":
    tester = AdversarialTester()
    res = tester.run_all_stress_tests()
    import json
    print(json.dumps(res, indent=2))
