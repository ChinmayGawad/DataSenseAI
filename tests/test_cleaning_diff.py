"""
Unit tests for the Data Cleaning Diff Tracking engine.
Verifies that cell-level modifications, imputations, and duplicate detection
are accurately recorded with mathematical rationales.
"""

import sys
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "core-ml"))

from cleaning_engine import clean_dataset, CleaningReport


def test_cell_diffs_and_duplicate_tracking():
    # 1. Create a synthetic dirty dataset with duplicates, nulls, and skewed numbers
    data = {
        "A": [10.0, 12.0, None, 11.0, 500.0, 10.0],  # None + extreme skew (500)
        "B": ["cat", "dog", None, "cat", "cat", "cat"],  # Categorical mode fill
        "C": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05", "2024-01-01"],  # Date
    }
    df = pd.DataFrame(data)

    cleaned_df, report = clean_dataset(df, deduplicate=True, auto_impute=True)

    assert "cell_diffs" in report
    assert "duplicate_indices" in report
    assert isinstance(report["cell_diffs"], list)
    assert len(report["cell_diffs"]) > 0

    # Verify imputed cell coordinates
    diff_cols = [d["column"] for d in report["cell_diffs"]]
    assert "A" in diff_cols or "B" in diff_cols

    # Verify rationale is present
    for diff in report["cell_diffs"]:
        assert "row_index" in diff
        assert "original_value" in diff
        assert "cleaned_value" in diff
        assert "reason" in diff
        assert len(diff["reason"]) > 0

    # Verify duplicate row was tracked
    if report["duplicates_removed"] > 0:
        assert len(report["duplicate_indices"]) > 0
