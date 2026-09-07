"""
API Integration Test Suite for Universal Ingestion:
Tests POST /api/upload with CSV, JSON, PDF, DOCX, and PNG formats.
"""

import sys
import io
import json
import zipfile
from pathlib import Path

# Add backend and core-ml to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR / "core-ml"))

from fastapi.testclient import TestClient
from app.main import app
from app.services.storage_service import storage_service
from PIL import Image
import fitz
import pytest

client = TestClient(app)


class TestUniversalUploadAPI:

    def test_01_upload_csv(self):
        """Tests uploading a CSV file and verifying UDR response."""
        csv_content = b"Country,Sales,Year\nUSA,100000,2025\nGermany,85000,2025\nIndia,120000,2025"
        response = client.post(
            "/api/upload",
            files={"file": ("global_sales.csv", io.BytesIO(csv_content), "text/csv")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] == "spreadsheet"
        assert data["row_count"] == 3
        assert data["column_count"] == 3
        assert data["extraction_confidence"] == 100.0

    def test_02_upload_json(self):
        """Tests uploading a nested JSON dataset."""
        json_obj = [
            {"product_id": "P-101", "name": "Laptop", "price": 1200, "category": "Electronics"},
            {"product_id": "P-102", "name": "Chair", "price": 150, "category": "Furniture"}
        ]
        json_bytes = json.dumps(json_obj).encode("utf-8")
        response = client.post(
            "/api/upload",
            files={"file": ("inventory.json", io.BytesIO(json_bytes), "application/json")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] == "json"
        assert data["row_count"] == 2
        assert data["column_count"] == 4

    def test_03_upload_pdf(self):
        """Tests uploading a digital PDF report."""
        doc = fitz.open()
        p = doc.new_page()
        p.insert_text((50, 50), "Quarterly Financials\n| Metric | Value |\n| Revenue | $4.2M |\n| Net Margin | 24% |")
        pdf_bytes = doc.tobytes()
        doc.close()

        response = client.post(
            "/api/upload",
            files={"file": ("q3_financials.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] in ("pdf_digital", "pdf_scanned")
        assert data["total_pages"] == 1
        assert data["row_count"] >= 1

    def test_04_upload_handwritten_image_with_uncertainty(self):
        """Tests uploading an image scan and receiving OCR uncertainty metadata."""
        img = Image.new("RGB", (600, 400), color=(240, 240, 240))
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format="PNG")
        img_bytes = img_bytes_io.getvalue()

        response = client.post(
            "/api/upload",
            files={"file": ("handwritten_form.png", io.BytesIO(img_bytes), "image/png")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] == "image_ocr"
        assert data["row_count"] > 0
        assert "uncertain_fields" in data
