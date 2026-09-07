"""
Universal Ingestion Engine Package Export.
"""

from .schema import (
    ExtractionConfidence,
    ExtractedTable,
    ExtractedEntity,
    UnifiedDocumentRepresentation
)
from .file_detector import detect_file_type
from .universal_engine import ingest_any_file, sanitize_dataframe
from .table_stitcher import stitch_table_fragments

__all__ = [
    "ingest_any_file",
    "detect_file_type",
    "sanitize_dataframe",
    "stitch_table_fragments",
    "ExtractionConfidence",
    "ExtractedTable",
    "ExtractedEntity",
    "UnifiedDocumentRepresentation"
]
