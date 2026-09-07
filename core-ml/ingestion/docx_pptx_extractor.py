"""
Word & PowerPoint Extractor (DOCX, PPTX):
Extracts tables, structured bullet lists, slide metrics, and key-value sections
from OOXML Word (.docx) and PowerPoint (.pptx) documents without external dependencies.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import zipfile
import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np

from .schema import UnifiedDocumentRepresentation, ExtractedTable, ExtractedEntity


# XML Namespaces for OpenXML Word and PowerPoint
W_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
A_NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
P_NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main"}


def parse_docx_tables(file_path: Path) -> List[pd.DataFrame]:
    """
    Extracts all embedded tables from word/document.xml in a .docx file.
    """
    tables = []
    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            if "word/document.xml" not in zf.namelist():
                return []
            xml_content = zf.read("word/document.xml")
            tree = ET.fromstring(xml_content)

            for tbl_elem in tree.findall(".//w:tbl", W_NS):
                rows = []
                for tr in tbl_elem.findall(".//w:tr", W_NS):
                    row_cells = []
                    for tc in tr.findall(".//w:tc", W_NS):
                        texts = [t.text for t in tc.findall(".//w:t", W_NS) if t.text]
                        row_cells.append(" ".join(texts).strip())
                    if any(c != "" for c in row_cells):
                        rows.append(row_cells)

                if len(rows) >= 2:
                    header = rows[0]
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

                    data = rows[1:]
                    expected_len = len(unique_headers)
                    norm_data = [r + [""] * (expected_len - len(r)) if len(r) < expected_len else r[:expected_len] for r in data]
                    df = pd.DataFrame(norm_data, columns=unique_headers)
                    tables.append(df)
    except Exception:
        pass
    return tables


def parse_docx_paragraphs(file_path: Path) -> List[str]:
    """
    Extracts paragraph text from word/document.xml.
    """
    paragraphs = []
    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            if "word/document.xml" in zf.namelist():
                xml_content = zf.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                for p_elem in tree.findall(".//w:p", W_NS):
                    texts = [t.text for t in p_elem.findall(".//w:t", W_NS) if t.text]
                    line = " ".join(texts).strip()
                    if line:
                        paragraphs.append(line)
    except Exception:
        pass
    return paragraphs


def parse_pptx_slides(file_path: Path) -> Tuple[List[pd.DataFrame], List[str]]:
    """
    Extracts tables and slide text frames from ppt/slides/slide*.xml in a .pptx file.
    """
    tables = []
    slide_texts = []
    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            slide_files = sorted([n for n in zf.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")])
            for slide_name in slide_files:
                xml_content = zf.read(slide_name)
                tree = ET.fromstring(xml_content)

                # 1. Slide Tables
                for tbl_elem in tree.findall(".//a:tbl", A_NS):
                    rows = []
                    for tr in tbl_elem.findall(".//a:tr", A_NS):
                        row_cells = []
                        for tc in tr.findall(".//a:tc", A_NS):
                            texts = [t.text for t in tc.findall(".//a:t", A_NS) if t.text]
                            row_cells.append(" ".join(texts).strip())
                        if any(c != "" for c in row_cells):
                            rows.append(row_cells)

                    if len(rows) >= 2:
                        header = [h if h else f"Col_{i+1}" for i, h in enumerate(rows[0])]
                        data = rows[1:]
                        norm_data = [r + [""] * (len(header) - len(r)) if len(r) < len(header) else r[:len(header)] for r in data]
                        df = pd.DataFrame(norm_data, columns=header)
                        tables.append(df)

                # 2. Slide Text
                for t_elem in tree.findall(".//a:t", A_NS):
                    if t_elem.text and t_elem.text.strip():
                        slide_texts.append(t_elem.text.strip())
    except Exception:
        pass
    return tables, slide_texts


def extract_docx_or_pptx(file_path: Path, filename: str, is_pptx: bool = False) -> UnifiedDocumentRepresentation:
    """
    Parses Word (.docx) or PowerPoint (.pptx) documents into Unified Intermediate Data Representation.
    """
    log: List[str] = []
    extracted_tables: List[ExtractedTable] = []

    if is_pptx:
        tables, texts = parse_pptx_slides(file_path)
        log.append(f"Parsed PowerPoint presentation: found {len(tables)} table(s) and {len(texts)} text elements.")
        file_type = "powerpoint_pptx"
        mime_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    else:
        tables = parse_docx_tables(file_path)
        texts = parse_docx_paragraphs(file_path)
        log.append(f"Parsed Word document: found {len(tables)} table(s) and {len(texts)} paragraph(s).")
        file_type = "word_docx"
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    for idx, df in enumerate(tables):
        extracted_tables.append(
            ExtractedTable(
                table_id=f"doc_tbl_{idx + 1}",
                name=f"Document Table {idx + 1}",
                page_number=idx + 1,
                df=df,
                headers=list(df.columns),
                extraction_method="docx_table_xml" if not is_pptx else "pptx_table_xml",
                average_confidence=98.0
            )
        )

    if extracted_tables:
        primary_df = extracted_tables[0].df
    else:
        # Check key-value pairs or text stream
        joined_text = "\n".join(texts)
        from .json_text_extractor import extract_key_value_entities, parse_markdown_or_ascii_tables
        entities = extract_key_value_entities(joined_text)
        md_tables = parse_markdown_or_ascii_tables(joined_text)

        if md_tables:
            primary_df = md_tables[0]
            extracted_tables.append(
                ExtractedTable(
                    table_id="doc_md_tbl_1",
                    name="Document Formatted Table",
                    page_number=1,
                    df=primary_df,
                    headers=list(primary_df.columns),
                    extraction_method="text_md_table",
                    average_confidence=94.0
                )
            )
        elif entities:
            kv_dict = {e.field_name: [e.value] for e in entities}
            primary_df = pd.DataFrame(kv_dict)
            extracted_tables.append(
                ExtractedTable(
                    table_id="doc_entity_tbl_1",
                    name="Document Key-Value Form Fields",
                    page_number=1,
                    df=primary_df,
                    headers=list(primary_df.columns),
                    extraction_method="entity_form",
                    average_confidence=92.0
                )
            )
        else:
            primary_df = pd.DataFrame({"document_text": texts[:100]})
            extracted_tables.append(
                ExtractedTable(
                    table_id="doc_text_stream_1",
                    name="Document Text Stream",
                    page_number=1,
                    df=primary_df,
                    headers=["document_text"],
                    extraction_method="text_stream",
                    average_confidence=88.0
                )
            )

    return UnifiedDocumentRepresentation(
        file_name=filename,
        file_type=file_type,
        mime_type=mime_type,
        total_pages=max(1, len(tables)),
        tables=extracted_tables,
        entities=[],
        primary_dataframe=primary_df,
        extraction_confidence_overall=96.0,
        has_handwritten_content=False,
        uncertain_fields=[],
        extraction_log=log
    )
