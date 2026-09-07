"""
Spreadsheet Extractor:
Extracts data from CSV, TSV, and Multi-sheet Excel workbooks (XLSX, XLS).
Performs encoding recovery, delimiter sniffing, and multi-sheet concatenation.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from .schema import UnifiedDocumentRepresentation, ExtractedTable, ExtractedEntity, ExtractionConfidence


def extract_spreadsheet(file_path: Path, filename: str) -> UnifiedDocumentRepresentation:
    """
    Parses spreadsheets (CSV, TSV, XLSX, XLS) into Unified Document Representation.
    """
    ext = file_path.suffix.lower()
    tables: List[ExtractedTable] = []
    log: List[str] = []

    if ext in (".xlsx", ".xls", ".xlsm"):
        # Multi-sheet Excel extraction
        try:
            excel_file = pd.ExcelFile(file_path)
            sheet_names = excel_file.sheet_names
            log.append(f"Detected Excel workbook with {len(sheet_names)} sheet(s): {', '.join(sheet_names)}")

            dfs_by_sheet = {}
            for sheet in sheet_names:
                sheet_df = pd.read_excel(excel_file, sheet_name=sheet)
                if not sheet_df.empty and len(sheet_df.columns) > 0:
                    dfs_by_sheet[sheet] = sheet_df
                    tables.append(
                        ExtractedTable(
                            table_id=f"sheet_{len(tables) + 1}",
                            name=f"Sheet: {sheet}",
                            page_number=len(tables) + 1,
                            df=sheet_df,
                            headers=[str(c) for c in sheet_df.columns],
                            extraction_method="excel_sheet_parser",
                            average_confidence=100.0
                        )
                    )

            if not dfs_by_sheet:
                primary_df = pd.DataFrame()
            else:
                # Check if multi-sheet concatenation is viable (same headers)
                first_headers = list(list(dfs_by_sheet.values())[0].columns)
                all_same_headers = all(list(df.columns) == first_headers for df in dfs_by_sheet.values())

                if len(dfs_by_sheet) > 1 and all_same_headers:
                    # Concatenate with sheet name indicator
                    combined_dfs = []
                    for sheet, df in dfs_by_sheet.items():
                        annotated = df.copy()
                        annotated["_source_sheet"] = sheet
                        combined_dfs.append(annotated)
                    primary_df = pd.concat(combined_dfs, ignore_index=True)
                    log.append(f"Combined {len(dfs_by_sheet)} sheets with matching schema into a master dataset ({len(primary_df):,} rows).")
                else:
                    # Select largest sheet by row/col count
                    largest_sheet = max(dfs_by_sheet.items(), key=lambda x: x[1].shape[0] * x[1].shape[1])[0]
                    primary_df = dfs_by_sheet[largest_sheet]
                    log.append(f"Selected primary sheet '{largest_sheet}' ({len(primary_df):,} rows).")

        except Exception as e:
            log.append(f"Excel extraction error: {str(e)}. Attempting single sheet fallback.")
            primary_df = pd.read_excel(file_path)
            tables.append(
                ExtractedTable(
                    table_id="sheet_1",
                    name="Primary Sheet",
                    page_number=1,
                    df=primary_df,
                    headers=[str(c) for c in primary_df.columns],
                    extraction_method="excel_fallback",
                    average_confidence=100.0
                )
            )
    else:
        # CSV / TSV with encoding and delimiter sniffing
        encodings = ["utf-8", "latin-1", "iso-8859-1", "cp1252"]
        separators = [",", "\t", ";", "|"]
        parsed_df = None

        for enc in encodings:
            for sep in separators:
                try:
                    df_candidate = pd.read_csv(file_path, encoding=enc, sep=sep, engine="python")
                    if df_candidate.shape[1] > 1 and len(df_candidate) > 0:
                        parsed_df = df_candidate
                        log.append(f"Parsed delimited file using encoding '{enc}' and delimiter '{repr(sep)}'.")
                        break
                except Exception:
                    continue
            if parsed_df is not None:
                break

        if parsed_df is None:
            # Fallback
            parsed_df = pd.read_csv(file_path, encoding="utf-8", encoding_errors="replace")
            log.append("Parsed CSV using UTF-8 replacement fallback.")

        primary_df = parsed_df
        tables.append(
            ExtractedTable(
                table_id="tbl_1",
                name="Delimited Table",
                page_number=1,
                df=primary_df,
                headers=[str(c) for c in primary_df.columns],
                extraction_method="csv_sniffer",
                average_confidence=100.0
            )
        )

    return UnifiedDocumentRepresentation(
        file_name=filename,
        file_type="spreadsheet",
        mime_type="application/vnd.ms-excel" if ext in (".xlsx", ".xls") else "text/csv",
        total_pages=len(tables),
        tables=tables,
        entities=[],
        primary_dataframe=primary_df,
        extraction_confidence_overall=100.0,
        has_handwritten_content=False,
        uncertain_fields=[],
        extraction_log=log
    )
