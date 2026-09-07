"""
Storage service: Handles raw dataset file ingestion, format detection,
and DataFrame loading with fallbacks for encodings and delimiters.
"""

import os
import re
import uuid
from pathlib import Path
from typing import Tuple, Dict, Any
import pandas as pd
from ..config import settings


class StorageService:
    def __init__(self):
        self.upload_dir = settings.LOCAL_UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def sanitize_filename(self, filename: str) -> str:
        clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
        return clean[:100]

    def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, Path, int]:
        file_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".csv"
        
        safe_name = f"{file_id}_{self.sanitize_filename(original_filename)}"
        target_path = self.upload_dir / safe_name
        
        with open(target_path, "wb") as f:
            f.write(file_bytes)
            
        file_size = target_path.stat().st_size
        return file_id, target_path, file_size

    def load_dataframe(self, file_path: Path) -> pd.DataFrame:
        ext = file_path.suffix.lower()
        if ext in (".xlsx", ".xls"):
            return pd.read_excel(file_path)
        
        # Try CSV with different encodings and separators
        encodings = ["utf-8", "latin-1", "iso-8859-1", "cp1252"]
        separators = [",", ";", "\t", "|"]
        
        for enc in encodings:
            for sep in separators:
                try:
                    df = pd.read_csv(file_path, encoding=enc, sep=sep, engine="python")
                    # If it successfully parsed into multiple columns or has at least 1 row
                    if df.shape[1] > 1 or len(df) > 0:
                        return df
                except Exception:
                    continue
                    
        # Final fallback
        return pd.read_csv(file_path, encoding="utf-8", encoding_errors="replace")


storage_service = StorageService()
