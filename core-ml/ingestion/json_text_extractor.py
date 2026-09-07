"""
JSON & Text Extractor:
Parses JSON, JSONL, NDJSON, Markdown tables, and semi-structured text logs/forms into tabular format.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import re
import pandas as pd
import numpy as np

from .schema import UnifiedDocumentRepresentation, ExtractedTable, ExtractedEntity


def parse_markdown_or_ascii_tables(text: str) -> List[pd.DataFrame]:
    """
    Extracts Markdown pipe tables (| Col1 | Col2 |) from text.
    """
    tables = []
    lines = text.split("\n")
    current_table_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|") and len(stripped) > 2:
            current_table_lines.append(stripped)
        else:
            if len(current_table_lines) >= 2:
                try:
                    # Convert markdown lines to dataframe
                    clean_rows = []
                    for t_line in current_table_lines:
                        # Skip delimiter rows like |---|---|
                        if set(t_line.replace("|", "").strip()).issubset({"-", ":", " "}):
                            continue
                        cells = [c.strip() for c in t_line.strip("|").split("|")]
                        clean_rows.append(cells)

                    if len(clean_rows) >= 2:
                        headers = clean_rows[0]
                        data = clean_rows[1:]
                        # Normalize lengths
                        data = [r + [""] * (len(headers) - len(r)) if len(r) < len(headers) else r[:len(headers)] for r in data]
                        df = pd.DataFrame(data, columns=headers)
                        tables.append(df)
                except Exception:
                    pass
            current_table_lines = []

    # Final check at end of text
    if len(current_table_lines) >= 2:
        try:
            clean_rows = []
            for t_line in current_table_lines:
                if set(t_line.replace("|", "").strip()).issubset({"-", ":", " "}):
                    continue
                cells = [c.strip() for c in t_line.strip("|").split("|")]
                clean_rows.append(cells)
            if len(clean_rows) >= 2:
                headers = clean_rows[0]
                data = clean_rows[1:]
                data = [r + [""] * (len(headers) - len(r)) if len(r) < len(headers) else r[:len(headers)] for r in data]
                df = pd.DataFrame(data, columns=headers)
                tables.append(df)
        except Exception:
            pass

    return tables


def extract_key_value_entities(text: str) -> List[ExtractedEntity]:
    """
    Extracts key-value form fields like 'Customer Name: John Doe' or 'Total Amount = ₹45,000'.
    """
    entities = []
    kv_pattern = re.compile(r"^([A-Za-z0-9 _\-\(\)]{2,35})\s*[:=]\s*(.+)$")

    for line in text.split("\n"):
        match = kv_pattern.match(line.strip())
        if match:
            k, v = match.group(1).strip(), match.group(2).strip()
            if len(v) > 0 and len(v) < 200:
                entities.append(
                    ExtractedEntity(
                        field_name=k,
                        value=v,
                        raw_text=line.strip(),
                        confidence=98.0
                    )
                )

    return entities


def extract_json_or_text(file_path: Path, filename: str, file_category: str) -> UnifiedDocumentRepresentation:
    """
    Parses JSON, JSONL, or plain text into normalized tabular structures.
    """
    ext = file_path.suffix.lower()
    log: List[str] = []
    tables: List[ExtractedTable] = []
    entities: List[ExtractedEntity] = []

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    if file_category == "json" or ext in (".json", ".jsonl", ".ndjson"):
        # JSON parsing
        try:
            # Try parsing as JSON array or object
            data = json.loads(content)
            if isinstance(data, list):
                primary_df = pd.json_normalize(data)
                log.append(f"Normalized top-level JSON array with {len(primary_df):,} records.")
            elif isinstance(data, dict):
                # Check for common collection keys
                collection_key = next((k for k in ["data", "rows", "records", "items", "results", "payload"] if isinstance(data.get(k), list)), None)
                if collection_key:
                    primary_df = pd.json_normalize(data[collection_key])
                    log.append(f"Extracted JSON array from key '{collection_key}' with {len(primary_df):,} records.")
                else:
                    primary_df = pd.json_normalize(data)
                    log.append("Normalized JSON key-value dictionary.")
            else:
                primary_df = pd.DataFrame({"value": [data]})

        except Exception:
            # Try JSON Lines (JSONL)
            jsonl_records = []
            for line in content.split("\n"):
                line_str = line.strip()
                if line_str:
                    try:
                        jsonl_records.append(json.loads(line_str))
                    except Exception:
                        pass
            if jsonl_records:
                primary_df = pd.json_normalize(jsonl_records)
                log.append(f"Parsed {len(primary_df):,} JSONL lines.")
            else:
                primary_df = pd.DataFrame({"raw_content": [content]})
                log.append("Fallback to raw text string.")

        tables.append(
            ExtractedTable(
                table_id="json_tbl_1",
                name="JSON Structure",
                page_number=1,
                df=primary_df,
                headers=[str(c) for c in primary_df.columns],
                extraction_method="json_normalize",
                average_confidence=100.0
            )
        )

    else:
        # Plain text / Markdown / Log extraction
        md_tables = parse_markdown_or_ascii_tables(content)
        entities = extract_key_value_entities(content)

        if md_tables:
            primary_df = md_tables[0]
            log.append(f"Extracted {len(md_tables)} Markdown table(s). Primary table has {len(primary_df):,} rows.")
            for i, tbl in enumerate(md_tables):
                tables.append(
                    ExtractedTable(
                        table_id=f"text_tbl_{i + 1}",
                        name=f"Text Table {i + 1}",
                        page_number=1,
                        df=tbl,
                        headers=[str(c) for c in tbl.columns],
                        extraction_method="markdown_parser",
                        average_confidence=95.0
                    )
                )
        elif entities:
            # Construct DataFrame from extracted key-value pairs
            kv_dict = {e.field_name: [e.value] for e in entities}
            primary_df = pd.DataFrame(kv_dict)
            log.append(f"Extracted {len(entities)} key-value form fields into tabular row.")
            tables.append(
                ExtractedTable(
                    table_id="entity_tbl_1",
                    name="Key-Value Form Fields",
                    page_number=1,
                    df=primary_df,
                    headers=[str(c) for c in primary_df.columns],
                    extraction_method="key_value_extractor",
                    average_confidence=95.0
                )
            )
        else:
            # Line by line text data
            non_empty_lines = [l.strip() for l in content.split("\n") if l.strip()]
            primary_df = pd.DataFrame({"line_number": list(range(1, len(non_empty_lines) + 1)), "text": non_empty_lines})
            log.append(f"Wrapped {len(non_empty_lines)} text lines into structured table.")
            tables.append(
                ExtractedTable(
                    table_id="text_raw_1",
                    name="Raw Text Stream",
                    page_number=1,
                    df=primary_df,
                    headers=["line_number", "text"],
                    extraction_method="line_stream",
                    average_confidence=90.0
                )
            )

    return UnifiedDocumentRepresentation(
        file_name=filename,
        file_type="json" if file_category == "json" else "text",
        mime_type="application/json" if file_category == "json" else "text/plain",
        total_pages=1,
        tables=tables,
        entities=entities,
        primary_dataframe=primary_df,
        extraction_confidence_overall=98.0,
        has_handwritten_content=False,
        uncertain_fields=[],
        extraction_log=log
    )
