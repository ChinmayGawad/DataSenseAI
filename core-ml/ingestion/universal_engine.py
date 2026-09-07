"""
Universal Data Intelligence Ingestion Engine:
Master entrypoint for ingesting any business document (CSV, TSV, XLSX, XLS, PDF,
DOCX, PPTX, Images, JSON, TXT) and normalizing it into the Unified Intermediate Data Representation (UDR).
"""

from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import pandas as pd
import numpy as np

from .schema import (
    UnifiedDocumentRepresentation,
    ExtractedTable,
    ExtractedEntity,
    ExtractionConfidence
)
from .file_detector import detect_file_type
from .spreadsheet_extractor import extract_spreadsheet
from .json_text_extractor import extract_json_or_text
from .pdf_extractor import extract_pdf_document
from .docx_pptx_extractor import extract_docx_or_pptx
from .image_ocr_extractor import extract_image_document


def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and standardizes DataFrame columns and types for downstream ML & Why? Engine pipelines.
    """
    if df.empty:
        return df

    # Convert all column headers to clean strings
    clean_cols = []
    seen = {}
    for idx, col in enumerate(df.columns):
        c_str = str(col).strip() if str(col).strip() != "" else f"Column_{idx + 1}"
        # Remove special control characters
        c_str = c_str.replace("\n", " ").replace("\r", "").replace("\t", " ")
        if c_str in seen:
            seen[c_str] += 1
            clean_cols.append(f"{c_str}_{seen[c_str]}")
        else:
            seen[c_str] = 1
            clean_cols.append(c_str)

    df.columns = clean_cols

    # Convert stringified numbers to numeric types where applicable
    for col in df.columns:
        if df[col].dtype == object:
            # Try numeric coercion if majority can be converted
            sample = df[col].dropna().astype(str).str.strip().str.replace(",", "").str.replace("₹", "").str.replace("$", "")
            try:
                converted = pd.to_numeric(sample, errors="coerce")
                if converted.notna().sum() > len(sample) * 0.7:
                    df[col] = pd.to_numeric(
                        df[col].astype(str).str.replace(",", "").str.replace("₹", "").str.replace("$", "").str.strip(),
                        errors="coerce"
                    )
            except Exception:
                pass

    return df


def ingest_any_file(
    file_path: Union[str, Path],
    original_filename: Optional[str] = None
) -> UnifiedDocumentRepresentation:
    """
    Ingests ANY document file, routes to the appropriate extraction layer,
    and returns a normalized UnifiedDocumentRepresentation.
    """
    path_obj = Path(file_path).resolve()
    filename = original_filename or path_obj.name

    if not path_obj.exists():
        raise FileNotFoundError(f"Document file not found at path: {path_obj}")

    # 1. Detect file category and format
    category, fmt, mime_type = detect_file_type(path_obj, filename)

    # 2. Route to specialized extraction layer
    if category == "spreadsheet":
        udr = extract_spreadsheet(path_obj, filename)
    elif category == "pdf":
        udr = extract_pdf_document(path_obj, filename)
    elif category == "word":
        udr = extract_docx_or_pptx(path_obj, filename, is_pptx=False)
    elif category == "powerpoint":
        udr = extract_docx_or_pptx(path_obj, filename, is_pptx=True)
    elif category == "image":
        udr = extract_image_document(path_obj, filename)
    elif category == "json":
        udr = extract_json_or_text(path_obj, filename, file_category="json")
    else:  # text / unknown
        udr = extract_json_or_text(path_obj, filename, file_category="text")

    # 3. Sanitize primary DataFrame
    udr.primary_dataframe = sanitize_dataframe(udr.primary_dataframe)

    return udr
