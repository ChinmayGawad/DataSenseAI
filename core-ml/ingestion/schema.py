"""
Unified Intermediate Data Representation (UDR) Schema:
Defines standard data contracts for tables, key-value entities, extraction confidences,
and document-level metadata extracted across any file format.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


class ExtractionConfidence:
    def __init__(
        self,
        field_name: str,
        value: Any,
        confidence: float,  # 0.0 to 100.0
        page_number: int = 1,
        is_handwritten: bool = False,
        verification_warning: Optional[str] = None
    ):
        self.field_name = field_name
        self.value = value
        self.confidence = round(confidence, 1)
        self.page_number = page_number
        self.is_handwritten = is_handwritten
        self.is_uncertain = confidence < 70.0
        self.verification_warning = verification_warning or (
            f"⚠️ Low extraction confidence ({self.confidence}%). Extracted from {'handwriting' if is_handwritten else 'unclear scan'}. Please verify."
            if self.is_uncertain else None
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field": self.field_name,
            "value": str(self.value) if self.value is not None else "",
            "confidence": self.confidence,
            "page": self.page_number,
            "is_handwritten": self.is_handwritten,
            "is_uncertain": self.is_uncertain,
            "warning": self.verification_warning
        }


class ExtractedTable:
    def __init__(
        self,
        table_id: str,
        name: str,
        page_number: int,
        df: pd.DataFrame,
        headers: List[str],
        extraction_method: str = "direct_parser",
        average_confidence: float = 100.0,
        page_range: Optional[str] = None
    ):
        self.table_id = table_id
        self.name = name
        self.page_number = page_number
        self.page_range = page_range or str(page_number)
        self.df = df
        self.headers = headers
        self.row_count = len(df)
        self.col_count = len(df.columns)
        self.extraction_method = extraction_method
        self.average_confidence = round(average_confidence, 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "table_id": self.table_id,
            "name": self.name,
            "page_number": self.page_number,
            "page_range": self.page_range,
            "rows": self.row_count,
            "cols": self.col_count,
            "headers": self.headers,
            "extraction_method": self.extraction_method,
            "average_confidence": self.average_confidence,
            "sample_rows": self.df.head(5).to_dict(orient="records") if not self.df.empty else []
        }


class ExtractedEntity:
    def __init__(
        self,
        field_name: str,
        value: Any,
        raw_text: str,
        confidence: float = 100.0,
        page_number: int = 1,
        is_handwritten: bool = False
    ):
        self.field_name = field_name
        self.value = value
        self.raw_text = raw_text
        self.confidence = round(confidence, 1)
        self.page_number = page_number
        self.is_handwritten = is_handwritten
        self.is_uncertain = confidence < 70.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field": self.field_name,
            "value": str(self.value) if self.value is not None else "",
            "raw_text": self.raw_text,
            "confidence": self.confidence,
            "page": self.page_number,
            "is_handwritten": self.is_handwritten,
            "is_uncertain": self.is_uncertain
        }


class UnifiedDocumentRepresentation:
    def __init__(
        self,
        file_name: str,
        file_type: str,  # csv, excel, pdf_digital, pdf_scanned, image_ocr, word_docx, powerpoint_pptx, json, text
        mime_type: str,
        total_pages: int,
        tables: List[ExtractedTable],
        entities: List[ExtractedEntity],
        primary_dataframe: pd.DataFrame,
        extraction_confidence_overall: float,
        has_handwritten_content: bool = False,
        uncertain_fields: Optional[List[ExtractionConfidence]] = None,
        extraction_log: Optional[List[str]] = None,
    ):
        self.file_name = file_name
        self.file_type = file_type
        self.mime_type = mime_type
        self.total_pages = max(1, total_pages)
        self.tables = tables
        self.entities = entities
        self.primary_dataframe = primary_dataframe
        self.extraction_confidence_overall = round(extraction_confidence_overall, 1)
        self.has_handwritten_content = has_handwritten_content
        self.uncertain_fields = uncertain_fields or []
        self.uncertain_fields_count = len(self.uncertain_fields)
        self.extraction_log = extraction_log or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file_name": self.file_name,
            "file_type": self.file_type,
            "mime_type": self.mime_type,
            "total_pages": self.total_pages,
            "tables_extracted": len(self.tables),
            "tables_summary": [t.to_dict() for t in self.tables],
            "entities_extracted": len(self.entities),
            "entities_summary": [e.to_dict() for e in self.entities[:20]],
            "row_count": len(self.primary_dataframe),
            "column_count": len(self.primary_dataframe.columns),
            "columns": list(self.primary_dataframe.columns),
            "extraction_confidence": self.extraction_confidence_overall,
            "has_handwritten_content": self.has_handwritten_content,
            "uncertain_fields_count": self.uncertain_fields_count,
            "uncertain_fields": [u.to_dict() for u in self.uncertain_fields],
            "extraction_log": self.extraction_log
        }
