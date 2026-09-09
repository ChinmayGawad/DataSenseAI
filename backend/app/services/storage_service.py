"""
Storage service: Handles universal file ingestion, format detection,
and DataFrame loading across CSV, Excel, PDF, Word, PPT, Image OCR, JSON, and Text.
"""

import os
import re
import sys
import uuid
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import pandas as pd
from ..config import settings

# Ensure core-ml is in sys.path
CORE_ML_DIR = Path(__file__).resolve().parent.parent.parent.parent / "core-ml"
if str(CORE_ML_DIR) not in sys.path:
    sys.path.append(str(CORE_ML_DIR))

from ingestion.universal_engine import ingest_any_file, ingest_multiple_files
from ingestion.schema import UnifiedDocumentRepresentation


class StorageService:
    def __init__(self):
        self.upload_dir = settings.LOCAL_UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def sanitize_filename(self, filename: str) -> str:
        clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
        return clean[:100]

    def save_file(self, file_bytes: bytes, original_filename: str, tenant_id: str = "default_tenant") -> Tuple[str, Path, int]:
        file_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".csv"
        
        # Isolated storage directory per tenant
        safe_tenant = self.sanitize_filename(tenant_id) or "default_tenant"
        tenant_dir = self.upload_dir / safe_tenant
        tenant_dir.mkdir(parents=True, exist_ok=True)

        safe_name = f"{file_id}_{self.sanitize_filename(original_filename)}"
        target_path = tenant_dir / safe_name
        
        with open(target_path, "wb") as f:
            f.write(file_bytes)
            
        file_size = target_path.stat().st_size
        return file_id, target_path, file_size

    def ingest_document(self, file_path: Path, filename: Optional[str] = None) -> UnifiedDocumentRepresentation:
        """
        Runs the Universal Ingestion Engine to extract normalized structured data and metadata.
        """
        return ingest_any_file(file_path, original_filename=filename)

    def ingest_multiple_documents(self, file_paths: list[Path], filenames: Optional[list[str]] = None) -> UnifiedDocumentRepresentation:
        """
        Runs the Universal Ingestion Engine across multiple documents, stitching tables and merging metadata.
        """
        return ingest_multiple_files(file_paths, original_filenames=filenames)

    def load_dataframe(self, file_path: Path) -> pd.DataFrame:
        """
        Extracts primary analyzable pandas DataFrame using the Universal Ingestion Engine.
        """
        try:
            udr = self.ingest_document(file_path)
            return udr.primary_dataframe
        except Exception as e:
            # Fallback for plain CSV/Excel
            ext = file_path.suffix.lower()
            if ext in (".xlsx", ".xls"):
                return pd.read_excel(file_path)
            return pd.read_csv(file_path, encoding="utf-8", encoding_errors="replace")


storage_service = StorageService()
