"""
PDF Engine (Digital & Scanned):
Extracts structured tables, multi-page stitched tables, text blocks, and key-value forms
from digital PDFs using pdfplumber and PyMuPDF (fitz), with automatic routing to OCR for scanned documents.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import re
import pandas as pd
import numpy as np

import pdfplumber
import fitz  # PyMuPDF

from .schema import UnifiedDocumentRepresentation, ExtractedTable, ExtractedEntity, ExtractionConfidence


def is_scanned_pdf(doc: fitz.Document) -> bool:
    """
    Evaluates whether a PDF is a scanned image document lacking a digital text layer.
    """
    total_chars = 0
    total_images = 0
    pages_to_check = min(5, len(doc))

    for page_idx in range(pages_to_check):
        page = doc[page_idx]
        text = page.get_text().strip()
        total_chars += len(text)
        total_images += len(page.get_images())

    # If average characters per page < 30 and images are present, it's scanned
    avg_chars = total_chars / max(pages_to_check, 1)
    return avg_chars < 30 and total_images > 0


def clean_pdf_table(raw_table: List[List[Optional[str]]]) -> Optional[pd.DataFrame]:
    """
    Cleans raw table cell matrices, infers headers, and removes empty rows/columns.
    """
    if not raw_table or len(raw_table) < 2:
        return None

    # Replace None with empty string and clean whitespace
    cleaned_rows = []
    for row in raw_table:
        cleaned_row = [str(c).strip() if c is not None else "" for c in row]
        if any(c != "" for c in cleaned_row):
            cleaned_rows.append(cleaned_row)

    if len(cleaned_rows) < 2:
        return None

    # Detect header row
    header = cleaned_rows[0]
    # If header contains duplicate or empty names, generate unique headers
    seen = {}
    unique_headers = []
    for idx, h in enumerate(header):
        name = h if h != "" else f"Column_{idx + 1}"
        if name in seen:
            seen[name] += 1
            unique_headers.append(f"{name}_{seen[name]}")
        else:
            seen[name] = 1
            unique_headers.append(name)

    data_rows = cleaned_rows[1:]
    # Normalize row lengths
    expected_cols = len(unique_headers)
    normalized_data = [
        r + [""] * (expected_cols - len(r)) if len(r) < expected_cols else r[:expected_cols]
        for r in data_rows
    ]

    df = pd.DataFrame(normalized_data, columns=unique_headers)
    # Filter out all-empty rows
    df = df.replace("", np.nan).dropna(how="all").fillna("")
    return df if len(df) > 0 else None


def extract_pdf_document(file_path: Path, filename: str) -> UnifiedDocumentRepresentation:
    """
    Master extractor for PDF documents. Handles digital tables, multi-page stitching,
    form fields, and routes scanned PDFs to the Image OCR Engine.
    """
    log: List[str] = []
    doc = fitz.open(file_path)
    total_pages = len(doc)
    log.append(f"Opened PDF with {total_pages} page(s).")

    # 1. Check for Scanned / Image-only PDF
    if is_scanned_pdf(doc):
        log.append("Detected scanned / image-dominant PDF. Routing to Image & OCR Extraction Layer.")
        from .image_ocr_extractor import extract_scanned_pdf_pages
        return extract_scanned_pdf_pages(doc, file_path, filename)

    # 2. Digital PDF Table Extraction using pdfplumber
    extracted_tables: List[ExtractedTable] = []
    page_dfs: List[Dict[str, Any]] = []

    with pdfplumber.open(file_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            p_num = page_idx + 1
            raw_tables = page.extract_tables()

            for t_idx, raw_t in enumerate(raw_tables):
                cleaned_df = clean_pdf_table(raw_t)
                if cleaned_df is not None and len(cleaned_df) > 0 and len(cleaned_df.columns) > 1:
                    page_dfs.append({
                        "page": p_num,
                        "table_index": t_idx + 1,
                        "df": cleaned_df,
                        "headers": list(cleaned_df.columns)
                    })

    log.append(f"Discovered {len(page_dfs)} individual table fragments across {total_pages} pages.")

    # 3. Multi-Page Table Continuation & Stitching
    # If consecutive pages share identical or compatible column headers, stitch them!
    if page_dfs:
        from .table_stitcher import stitch_table_fragments
        stitched_tables = stitch_table_fragments(page_dfs)
        extracted_tables.extend(stitched_tables)
        primary_df = stitched_tables[0].df
        log.append(f"Synthesized {len(stitched_tables)} coherent table(s) from fragments. Primary dataset has {len(primary_df):,} rows.")
    else:
        # Fallback: Extract text lines and key-value fields from PyMuPDF
        log.append("No explicit grid tables found. Extracting text blocks and structured form entities.")
        all_text = ""
        for page in doc:
            all_text += page.get_text() + "\n"

        from .json_text_extractor import extract_key_value_entities, parse_markdown_or_ascii_tables
        entities = extract_key_value_entities(all_text)
        md_tables = parse_markdown_or_ascii_tables(all_text)

        if md_tables:
            primary_df = md_tables[0]
            extracted_tables.append(
                ExtractedTable(
                    table_id="pdf_text_tbl_1",
                    name="Text-Formatted Table",
                    page_number=1,
                    df=primary_df,
                    headers=list(primary_df.columns),
                    extraction_method="pdf_text_stream",
                    average_confidence=92.0
                )
            )
        elif entities:
            kv_dict = {e.field_name: [e.value] for e in entities}
            primary_df = pd.DataFrame(kv_dict)
            extracted_tables.append(
                ExtractedTable(
                    table_id="pdf_form_tbl_1",
                    name="PDF Form Key-Value Entity Table",
                    page_number=1,
                    df=primary_df,
                    headers=list(primary_df.columns),
                    extraction_method="pdf_form_entities",
                    average_confidence=94.0
                )
            )
        else:
            lines = [l.strip() for l in all_text.split("\n") if l.strip()]
            primary_df = pd.DataFrame({"page_text": lines})
            extracted_tables.append(
                ExtractedTable(
                    table_id="pdf_stream_1",
                    name="PDF Text Stream",
                    page_number=1,
                    df=primary_df,
                    headers=["page_text"],
                    extraction_method="raw_stream",
                    average_confidence=85.0
                )
            )

    return UnifiedDocumentRepresentation(
        file_name=filename,
        file_type="pdf_digital",
        mime_type="application/pdf",
        total_pages=total_pages,
        tables=extracted_tables,
        entities=[],
        primary_dataframe=primary_df,
        extraction_confidence_overall=96.0,
        has_handwritten_content=False,
        uncertain_fields=[],
        extraction_log=log
    )
