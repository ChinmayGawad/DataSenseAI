"""
Data Plugin: Ingests datasets from CSV/Excel and connects Agent 1 and Agent 2 to profiling tools.
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd

# Ensure core-ml directory is in sys.path
CORE_ML_DIR = str(Path(__file__).resolve().parent.parent.parent / "core-ml")
if CORE_ML_DIR not in sys.path:
    sys.path.insert(0, CORE_ML_DIR)

import column_inspector
import quality_inspector


def load_dataframe(file_path: str) -> pd.DataFrame:
    """Reads a CSV or Excel file into a pandas DataFrame."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at path: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        try:
            return pd.read_csv(file_path, encoding="utf-8")
        except UnicodeDecodeError:
            return pd.read_csv(file_path, encoding="latin1")
    elif ext in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)
    else:
        # Try CSV as fallback
        return pd.read_csv(file_path)


def load_and_inspect_data(file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any], Dict[str, Any]]:
    """
    Ingests raw dataset and executes column profiling & data hygiene inspection.
    Returns: (df, column_metadata_dict, quality_report_dict)
    """
    df = load_dataframe(file_path)
    col_metadata = column_inspector.detect_column_types(df)
    quality_report = quality_inspector.inspect_data_quality(df)
    return df, col_metadata, quality_report
