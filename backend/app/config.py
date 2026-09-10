"""
Application configuration for DataSense AI backend.
Supports environment variables with intelligent local defaults for development & hackathon demos.
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "DataSense AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Upload storage
    LOCAL_UPLOAD_DIR: Path = UPLOAD_DIR
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set[str] = {
        ".csv", ".tsv", ".xlsx", ".xls", ".xlsm", ".parquet",
        ".json", ".jsonl", ".txt", ".md", ".log",
        ".pdf", ".docx", ".pptx",
        ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp",
        ".zip", ".tar", ".gz"
    }
    
    # Supabase (Optional fallback to local storage)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    USE_MOCK_STORAGE: bool = os.getenv("USE_MOCK_STORAGE", "true").lower() in ("1", "true", "yes")

    # Harness Service URL (Microservice bridge)
    HARNESS_SERVICE_URL: str = os.getenv("HARNESS_SERVICE_URL", "http://localhost:4000")

    # Enterprise Multi-Tenant Authentication & JWT
    AUTH_ENABLED: bool = os.getenv("AUTH_ENABLED", "false").lower() in ("1", "true", "yes")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "datasense-enterprise-jwt-secret-token-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Distributed Task Queue & Worker Mode ("background" or "celery")
    WORKER_MODE: str = os.getenv("WORKER_MODE", "background").lower()
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_REDIS_STORE: bool = os.getenv("USE_REDIS_STORE", "false").lower() in ("1", "true", "yes")

settings = Settings()

