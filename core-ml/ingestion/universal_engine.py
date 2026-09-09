"""
Universal Data Intelligence Ingestion Engine:
Master entrypoint for ingesting any business document (CSV, TSV, XLSX, XLS, XLSM, PARQUET, PDF,
DOCX, PPTX, Images, JSON, TXT, MD, ZIP) and normalizing it into the Unified Intermediate Data Representation (UDR).
Supports single-file and multi-file batch ingestion with cross-document table stitching.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import zipfile
import tarfile
import tempfile
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
from .table_stitcher import stitch_multi_page_tables


def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and standardizes DataFrame columns and types for downstream ML & Why? Engine pipelines.
    """
    if df is None or df.empty:
        return pd.DataFrame()

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
            if not sample.empty:
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
    Ingests ANY single document file, routes to the appropriate extraction layer,
    and returns a normalized UnifiedDocumentRepresentation.
    """
    path_obj = Path(file_path).resolve()
    filename = original_filename or path_obj.name

    if not path_obj.exists():
        raise FileNotFoundError(f"Document file not found at path: {path_obj}")

    # Handle ZIP / Archive bundles
    suffix = path_obj.suffix.lower()
    if suffix in (".zip", ".tar", ".gz", ".tgz"):
        return ingest_archive_bundle(path_obj, filename)

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
    else:  # text / markdown / unknown
        udr = extract_json_or_text(path_obj, filename, file_category="text")

    # 3. Sanitize primary DataFrame
    udr.primary_dataframe = sanitize_dataframe(udr.primary_dataframe)

    return udr


def ingest_archive_bundle(
    archive_path: Path,
    original_filename: str
) -> UnifiedDocumentRepresentation:
    """
    Extracts an archive (.zip / .tar.gz) and ingests all contained business documents.
    """
    extract_dir = archive_path.parent / f"_unpacked_{archive_path.stem}"
    extract_dir.mkdir(parents=True, exist_ok=True)

    extracted_files: List[Path] = []
    try:
        if archive_path.suffix.lower() == ".zip":
            with zipfile.ZipFile(archive_path, 'r') as zf:
                zf.extractall(extract_dir)
        elif archive_path.suffix.lower() in (".tar", ".gz", ".tgz"):
            with tarfile.open(archive_path, 'r:*') as tf:
                tf.extractall(extract_dir)

        # Recursively discover all extracted document files
        for p in extract_dir.rglob("*"):
            if p.is_file() and not p.name.startswith((".", "_", "~")):
                extracted_files.append(p)

        if not extracted_files:
            return UnifiedDocumentRepresentation(
                file_name=original_filename,
                file_type="archive_empty",
                mime_type="application/zip",
                total_pages=1,
                tables=[],
                entities=[],
                primary_dataframe=pd.DataFrame(),
                extraction_confidence_overall=100.0,
                extraction_log=[f"Archive '{original_filename}' was extracted but contained no valid documents."]
            )

        return ingest_multiple_files(extracted_files, [f.name for f in extracted_files])

    finally:
        pass


def ingest_multiple_files(
    file_paths: List[Union[str, Path]],
    original_filenames: Optional[List[str]] = None
) -> UnifiedDocumentRepresentation:
    """
    Ingests multiple heterogeneous files (PDFs, Excels, Word Docs, Images, JSONs),
    stitches related tables together across files, merges low-confidence fields,
    and returns a unified multi-document representation.
    """
    if not file_paths:
        return UnifiedDocumentRepresentation(
            file_name="empty_batch",
            file_type="multi_document_bundle",
            mime_type="multipart/mixed",
            total_pages=0,
            tables=[],
            entities=[],
            primary_dataframe=pd.DataFrame(),
            extraction_confidence_overall=100.0,
            extraction_log=["Empty file list provided for batch ingestion."]
        )

    if len(file_paths) == 1:
        fname = original_filenames[0] if original_filenames else None
        return ingest_any_file(file_paths[0], fname)

    all_udrs: List[UnifiedDocumentRepresentation] = []
    all_tables: List[ExtractedTable] = []
    all_uncertain_fields: List[ExtractionConfidence] = []
    all_entities: List[ExtractedEntity] = []
    combined_logs: List[str] = []
    total_pages = 0
    has_handwritten = False
    confidence_scores: List[float] = []

    for idx, fpath in enumerate(file_paths):
        path_obj = Path(fpath).resolve()
        fname = original_filenames[idx] if (original_filenames and idx < len(original_filenames)) else path_obj.name

        try:
            udr = ingest_any_file(path_obj, fname)
            all_udrs.append(udr)
            total_pages += max(udr.total_pages, 1)
            confidence_scores.append(udr.extraction_confidence_overall)
            has_handwritten = has_handwritten or udr.has_handwritten_content

            # Collect tables with file origin tagged in name
            for t in udr.tables:
                t_copy = ExtractedTable(
                    table_id=f"{fname}_{t.table_id}",
                    name=f"{fname} • {t.name}",
                    page_number=t.page_number,
                    df=t.df if hasattr(t, 'df') else t.dataframe,
                    headers=t.headers,
                    extraction_method=t.extraction_method,
                    average_confidence=t.average_confidence,
                    page_range=t.page_range
                )
                all_tables.append(t_copy)

            all_uncertain_fields.extend(udr.uncertain_fields)
            all_entities.extend(udr.entities if hasattr(udr, 'entities') else udr.extracted_entities)
            combined_logs.extend(udr.extraction_log)

        except Exception as e:
            combined_logs.append(f"Error ingesting '{fname}': {str(e)}")

    # Cross-document table stitching
    stitched_tables = stitch_multi_page_tables(all_tables)

    # Determine primary master DataFrame
    # 1. Try concatenating stitched tables if they share identical columns
    primary_df = pd.DataFrame()
    if stitched_tables:
        first_cols = list(stitched_tables[0].df.columns)
        compatible_dfs = [
            t.df for t in stitched_tables
            if list(t.df.columns) == first_cols and not t.df.empty
        ]
        if len(compatible_dfs) > 1:
            try:
                primary_df = pd.concat(compatible_dfs, ignore_index=True)
            except Exception:
                primary_df = stitched_tables[0].df
        else:
            # Pick the largest table by row count
            largest = max(stitched_tables, key=lambda t: len(t.df) if t.df is not None else 0)
            primary_df = largest.df
    elif all_udrs:
        # Fallback to the largest primary df among individual UDRs
        largest_udr = max(all_udrs, key=lambda u: len(u.primary_dataframe) if u.primary_dataframe is not None else 0)
        primary_df = largest_udr.primary_dataframe

    primary_df = sanitize_dataframe(primary_df)

    avg_conf = float(np.mean(confidence_scores)) if confidence_scores else 100.0
    bundle_name = f"Multi-Document Bundle ({len(file_paths)} files)"

    return UnifiedDocumentRepresentation(
        file_name=bundle_name,
        file_type="multi_document_bundle",
        mime_type="multipart/mixed",
        total_pages=total_pages,
        tables=stitched_tables if stitched_tables else all_tables,
        entities=all_entities,
        primary_dataframe=primary_df,
        extraction_confidence_overall=round(avg_conf, 1),
        has_handwritten_content=has_handwritten,
        uncertain_fields=all_uncertain_fields,
        extraction_log=combined_logs
    )
