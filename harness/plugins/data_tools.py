"""
Data Plugin: Ingests documents across any format (PDF, Excel, Word, CSV, Images, JSON)
and connects Agent 1 (Schema Profiler) and Agent 2 (Quality Inspector) to UDR ingestion pipelines.
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
from ingestion.universal_engine import ingest_any_file


def load_dataframe(file_path: str) -> pd.DataFrame:
    """Ingests any business document and extracts the primary analyzable pandas DataFrame."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at path: {file_path}")

    udr = ingest_any_file(file_path)
    return udr.primary_dataframe


def load_and_inspect_data(file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any], Dict[str, Any]]:
    """
    Ingests raw document, extracts UDR, and executes column profiling & data hygiene inspection.
    Returns: (df, column_metadata_dict, quality_report_dict)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at path: {file_path}")

    udr = ingest_any_file(file_path)
    df = udr.primary_dataframe
    
    col_metadata = column_inspector.detect_column_types(df)
    quality_report = quality_inspector.inspect_data_quality(
        df,
        extraction_metadata={
            "extraction_confidence": udr.extraction_confidence_overall,
            "has_handwritten_content": udr.has_handwritten_content,
            "uncertain_fields": [u.to_dict() for u in udr.uncertain_fields],
            "file_type": udr.file_type,
            "total_pages": udr.total_pages,
            "tables_extracted": len(udr.tables)
        }
    )
    return df, col_metadata, quality_report
