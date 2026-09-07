from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ColumnDetail(BaseModel):
    name: str
    detected_type: str
    pandas_dtype: str
    unique_count: int
    null_count: int
    null_percentage: float
    is_id: bool
    is_date: bool
    is_numeric: bool
    is_categorical: bool
    sample_values: List[Any] = Field(default_factory=list)
    suggested_role: str


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    file_format: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str = "Dataset uploaded successfully"


class HealthScoreResponse(BaseModel):
    health_score: float
    quality_grade: str
    total_rows: int
    duplicate_rows_count: int
    total_missing_cells: int
    missing_cell_percentage: float
    issues_summary: List[str]


class DatasetMetadataResponse(BaseModel):
    dataset_id: str
    filename: str
    total_rows: int
    total_columns: int
    columns: List[ColumnDetail]
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    id_columns: List[str]
    health: HealthScoreResponse
