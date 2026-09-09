"""
Multi-Format & Multi-File Batch Ingestion Test Suite:
Tests uploading multiple heterogeneous files in a single batch, ZIP archive bundles,
and cross-document table stitching.
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
import pytest

client = TestClient(app)


class TestMultiFormatBatchUpload:

    def test_01_batch_upload_heterogeneous_files(self):
        """Tests uploading a batch with CSV + JSON files simultaneously."""
        csv_bytes = b"Product,Price,Quantity\nPhone,800,5\nTablet,500,10"
        json_bytes = json.dumps([
            {"Product": "Monitor", "Price": 300, "Quantity": 8},
            {"Product": "Mouse", "Price": 25, "Quantity": 20}
        ]).encode("utf-8")

        files = [
            ("files", ("products_part1.csv", io.BytesIO(csv_bytes), "text/csv")),
            ("files", ("products_part2.json", io.BytesIO(json_bytes), "application/json"))
        ]

        response = client.post("/api/upload", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["total_files_count"] == 2
        assert len(data["files_summary"]) == 2
        assert data["file_type"] == "multi_document_bundle"
        assert data["row_count"] >= 2
        assert len(data["columns"]) >= 3

    def test_02_zip_archive_bundle_auto_extraction(self):
        """Tests uploading a ZIP archive containing multiple business documents."""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("sheet1.csv", "Region,Revenue,Deals\nEMEA,50000,12\nAPAC,75000,18")
            zf.writestr("sheet2.csv", "Region,Revenue,Deals\nLATAM,30000,8\nNA,120000,25")
        zip_bytes = zip_buffer.getvalue()

        response = client.post(
            "/api/upload",
            files={"file": ("sales_bundle.zip", io.BytesIO(zip_bytes), "application/zip")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] == "multi_document_bundle"
        assert data["row_count"] >= 4  # Stitched tables
        assert data["total_pages"] >= 2
        assert len(data["tables_summary"]) >= 1

    def test_03_batch_dedicated_endpoint(self):
        """Tests the dedicated POST /api/upload/batch endpoint."""
        csv1 = b"ID,Name,Department\n1,Alice,Engineering\n2,Bob,Product"
        csv2 = b"ID,Name,Department\n3,Carol,Marketing\n4,Dave,Design"

        files = [
            ("files", ("team_a.csv", io.BytesIO(csv1), "text/csv")),
            ("files", ("team_b.csv", io.BytesIO(csv2), "text/csv"))
        ]

        response = client.post("/api/upload/batch", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["total_files_count"] == 2
        assert data["row_count"] == 4  # Stitched identical schemas
