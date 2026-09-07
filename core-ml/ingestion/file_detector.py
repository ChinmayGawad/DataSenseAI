"""
File Type & Format Sniffer:
Inspects magic bytes, headers, and extensions to accurately classify documents
into appropriate extraction pipelines (Spreadsheet, Digital/Scanned PDF, DOCX, PPTX, Image, JSON, Text).
"""

from pathlib import Path
from typing import Tuple, Optional
import zipfile


def detect_file_type(file_path: Path, original_filename: str = "") -> Tuple[str, str, str]:
    """
    Detects document category, format extension, and MIME type using magic bytes and fallback heuristics.
    Returns: (category, format, mime_type)
    Categories: 'spreadsheet', 'pdf', 'image', 'word', 'powerpoint', 'json', 'text'
    """
    ext = Path(original_filename or file_path).suffix.lower()

    # Read first 2KB for magic byte analysis
    try:
        with open(file_path, "rb") as f:
            header = f.read(2048)
    except Exception:
        header = b""

    # 1. PDF Detection
    if header.startswith(b"%PDF") or ext == ".pdf":
        return "pdf", "pdf", "application/pdf"

    # 2. Image Detection (PNG, JPEG, GIF, WEBP, TIFF)
    if header.startswith(b"\x89PNG\r\n\x1a\n") or ext == ".png":
        return "image", "png", "image/png"
    if header.startswith(b"\xff\xd8\xff") or ext in (".jpg", ".jpeg"):
        return "image", "jpeg", "image/jpeg"
    if header.startswith(b"RIFF") and b"WEBP" in header[:16] or ext == ".webp":
        return "image", "webp", "image/webp"
    if header.startswith(b"II*\x00") or header.startswith(b"MM\x00*") or ext in (".tif", ".tiff"):
        return "image", "tiff", "image/tiff"
    if header.startswith(b"GIF8") or ext == ".gif":
        return "image", "gif", "image/gif"

    # 3. Zip-based OpenXML formats (DOCX, PPTX, XLSX)
    if header.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(file_path, "r") as zf:
                names = zf.namelist()
                if any(n.startswith("word/") for n in names) or ext == ".docx":
                    return "word", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                if any(n.startswith("ppt/") for n in names) or ext == ".pptx":
                    return "powerpoint", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                if any(n.startswith("xl/") for n in names) or ext in (".xlsx", ".xlsm"):
                    return "spreadsheet", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        except Exception:
            pass

    # 4. Legacy Excel Binary (BIFF8 .xls)
    if header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1") or ext == ".xls":
        return "spreadsheet", "xls", "application/vnd.ms-excel"

    # 5. JSON / JSONL Detection
    stripped_text = header.strip()
    if (stripped_text.startswith(b"{") and stripped_text.endswith(b"}")) or \
       (stripped_text.startswith(b"[") and stripped_text.endswith(b"]")) or \
       ext in (".json", ".jsonl", ".ndjson"):
        return "json", ext.replace(".", "") or "json", "application/json"

    # 6. Delimited Text (CSV, TSV, Semicolon, Pipe)
    if ext in (".csv", ".tsv", ".tab"):
        if b"\t" in header and ext in (".tsv", ".tab"):
            return "spreadsheet", "tsv", "text/tab-separated-values"
        return "spreadsheet", "csv", "text/csv"

    if ext in (".txt", ".log", ".md"):
        return "text", ext.replace(".", ""), "text/plain"

    # Fallback to extension or text
    if ext:
        clean_ext = ext.replace(".", "")
        return "spreadsheet" if clean_ext in ("csv", "tsv", "xlsx", "xls") else "text", clean_ext, "text/plain"

    return "text", "txt", "text/plain"
