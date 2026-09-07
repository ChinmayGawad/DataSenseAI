"""
Unit Test Suite for Universal Ingestion Engine:
Tests multi-format ingestion across CSV, Excel, JSON, Markdown/Text, PDF, DOCX, PPTX, and Image OCR.
"""

import os
import sys
import tempfile
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

CORE_ML_DIR = str(Path(__file__).resolve().parent.parent / "core-ml")
if CORE_ML_DIR not in sys.path:
    sys.path.insert(0, CORE_ML_DIR)

import pandas as pd
import numpy as np
from PIL import Image
import fitz  # PyMuPDF
import pytest

from ingestion.schema import (
    ExtractionConfidence,
    ExtractedTable,
    ExtractedEntity,
    UnifiedDocumentRepresentation
)
from ingestion.file_detector import detect_file_type
from ingestion.universal_engine import ingest_any_file, sanitize_dataframe
from ingestion.table_stitcher import stitch_table_fragments, calculate_header_similarity
import quality_inspector


@pytest.fixture
def workspace_tmp():
    test_dir = Path(__file__).resolve().parent / "_tmp_test_dir"
    test_dir.mkdir(parents=True, exist_ok=True)
    yield test_dir
    import shutil
    shutil.rmtree(test_dir, ignore_errors=True)


class TestUniversalIngestion:

    def test_01_file_detector(self, workspace_tmp):
        """Tests magic bytes and file type classifier across various formats."""
        # 1. CSV
        csv_file = workspace_tmp / "data.csv"
        csv_file.write_text("a,b,c\n1,2,3\n4,5,6")
        cat, fmt, mime = detect_file_type(csv_file)
        assert cat == "spreadsheet"
        assert fmt == "csv"

        # 2. JSON
        json_file = workspace_tmp / "data.json"
        json_file.write_text(json.dumps([{"id": 1, "val": 100}, {"id": 2, "val": 200}]))
        cat, fmt, mime = detect_file_type(json_file)
        assert cat == "json"

        # 3. PDF
        pdf_file = workspace_tmp / "doc.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Test Document")
        doc.save(str(pdf_file))
        doc.close()
        cat, fmt, mime = detect_file_type(pdf_file)
        assert cat == "pdf"

    def test_02_csv_tsv_spreadsheet_extractor(self, workspace_tmp):
        """Tests delimiter sniffing, encoding handling, and CSV parsing."""
        # Semicolon delimited CSV
        sc_file = workspace_tmp / "sales_europe.csv"
        sc_file.write_text("Product;Sales;Margin;Region\nWidget A;1000;250;EMEA\nWidget B;2000;400;APAC")
        udr = ingest_any_file(sc_file)

        assert udr.file_type == "spreadsheet"
        assert len(udr.primary_dataframe) == 2
        assert "Product" in udr.primary_dataframe.columns
        assert "Sales" in udr.primary_dataframe.columns
        assert udr.extraction_confidence_overall == 100.0

    def test_03_multisheet_excel_extractor(self, workspace_tmp):
        """Tests multi-sheet Excel workbook parsing and automated sheet stitching."""
        excel_path = workspace_tmp / "quarterly_reports.xlsx"
        df_q1 = pd.DataFrame({"Month": ["Jan", "Feb"], "Revenue": [50000, 55000], "Profit": [12000, 14000]})
        df_q2 = pd.DataFrame({"Month": ["Mar", "Apr"], "Revenue": [60000, 62000], "Profit": [15000, 16000]})

        with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
            df_q1.to_excel(writer, sheet_name="Q1_Sales", index=False)
            df_q2.to_excel(writer, sheet_name="Q2_Sales", index=False)

        udr = ingest_any_file(excel_path)
        assert udr.file_type == "spreadsheet"
        assert len(udr.tables) == 2
        # Automatically stitched matching schema sheets
        assert len(udr.primary_dataframe) == 4
        assert "Revenue" in udr.primary_dataframe.columns

    def test_04_json_and_jsonl_extractor(self, workspace_tmp):
        """Tests nested JSON normalization and JSON Lines extraction."""
        # Nested JSON structure
        json_path = workspace_tmp / "customers.json"
        nested_data = {
            "status": "success",
            "data": [
                {"customer_id": "C01", "profile": {"name": "Alice", "segment": "Corporate"}, "spend": 4500},
                {"customer_id": "C02", "profile": {"name": "Bob", "segment": "Consumer"}, "spend": 1200}
            ]
        }
        json_path.write_text(json.dumps(nested_data))

        udr = ingest_any_file(json_path)
        assert udr.file_type == "json"
        assert len(udr.primary_dataframe) == 2
        assert "profile.name" in udr.primary_dataframe.columns or "customer_id" in udr.primary_dataframe.columns

    def test_05_markdown_and_plain_text_extractor(self, workspace_tmp):
        """Tests Markdown pipe table parsing and Key-Value entity detection."""
        txt_path = workspace_tmp / "monthly_brief.txt"
        content = """# Executive Briefing
Customer Name: Apex Global Logistics
Account ID: ACC-9921
Renewal Date: 2026-12-31

| Quarter | Revenue | Churn Rate |
|---|---|---|
| Q1 | $120,000 | 1.2% |
| Q2 | $145,000 | 0.8% |
| Q3 | $160,000 | 1.1% |
"""
        txt_path.write_text(content)

        udr = ingest_any_file(txt_path)
        assert udr.file_type == "text"
        assert len(udr.primary_dataframe) == 3
        assert "Quarter" in udr.primary_dataframe.columns
        assert "Revenue" in udr.primary_dataframe.columns

    def test_06_docx_and_pptx_extractor(self, workspace_tmp):
        """Tests Word (.docx) table and paragraph extraction via OpenXML zipfile parsing."""
        docx_path = workspace_tmp / "report.docx"
        
        # Construct minimal valid OOXML .docx with a table
        doc_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Department</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Budget</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Headcount</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Engineering</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>500000</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>24</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Marketing</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>250000</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>12</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>"""

        with zipfile.ZipFile(docx_path, "w") as zf:
            zf.writestr("word/document.xml", doc_xml)
            zf.writestr("[Content_Types].xml", "<Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'></Types>")

        udr = ingest_any_file(docx_path)
        assert udr.file_type == "word_docx"
        assert len(udr.primary_dataframe) == 2
        assert "Department" in udr.primary_dataframe.columns
        assert "Budget" in udr.primary_dataframe.columns

    def test_07_image_and_handwriting_ocr_confidence(self, workspace_tmp):
        """Tests image layout extraction, handwriting detection, and low-confidence uncertainty warnings."""
        img_path = workspace_tmp / "hospital_chart.png"
        
        # Create a test image with high variance / noise simulating scanned handwriting
        np_noise = np.random.randint(50, 200, size=(400, 600), dtype=np.uint8)
        img = Image.fromarray(np_noise, mode="L")
        img.save(str(img_path))

        udr = ingest_any_file(img_path)
        assert udr.file_type == "image_ocr"
        assert len(udr.primary_dataframe) > 0
        assert udr.has_handwritten_content is True
        # Should flag uncertain fields with <70% confidence
        assert udr.uncertain_fields_count > 0
        assert any(u.confidence < 70.0 for u in udr.uncertain_fields)
        assert any("low confidence" in u.verification_warning.lower() for u in udr.uncertain_fields)

    def test_08_pdf_multi_page_table_stitching(self, workspace_tmp):
        """Tests multi-page PDF generation and table fragment reconciliation."""
        pdf_path = workspace_tmp / "multi_page_sales.pdf"
        doc = fitz.open()

        # Page 1
        p1 = doc.new_page()
        p1.insert_text((50, 50), "Sales Report Page 1\n| Region | Sales | Profit |\n| North | 10000 | 2500 |\n| South | 15000 | 3800 |")
        
        # Page 2
        p2 = doc.new_page()
        p2.insert_text((50, 50), "Sales Report Page 2\n| Region | Sales | Profit |\n| East | 12000 | 2900 |\n| West | 18000 | 4500 |")

        doc.save(str(pdf_path))
        doc.close()

        udr = ingest_any_file(pdf_path)
        assert udr.file_type == "pdf_digital"
        assert udr.total_pages == 2
        assert len(udr.primary_dataframe) >= 2

    def test_09_quality_inspector_ocr_uncertainty_audit(self):
        """Tests that quality_inspector incorporates extraction uncertainty into Health Score and report."""
        df = pd.DataFrame({
            "Patient_Name": ["Jeevan", "Priya", "Arun"],
            "Salary": [35000, 42000, 28500],
            "Age": [23, 34, 41]
        })

        extraction_meta = {
            "extraction_confidence": 68.5,
            "has_handwritten_content": True,
            "uncertain_fields": [
                {"field": "Salary", "value": "35000", "confidence": 63.5, "warning": "Low OCR confidence (63.5%)."}
            ]
        }

        report = quality_inspector.inspect_data_quality(df, extraction_metadata=extraction_meta)
        assert "extraction_audit" in report
        assert report["extraction_audit"]["uncertain_fields_count"] == 1
        assert any("low OCR confidence" in issue for issue in report["issues_summary"])
        # Score is reduced due to OCR uncertainty penalty
        assert report["health_score"] < 100.0
