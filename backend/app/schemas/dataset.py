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


class UncertainFieldModel(BaseModel):
    field: str
    value: str
    confidence: float
    page: int = 1
    is_handwritten: bool = False
    is_uncertain: bool = True
    warning: Optional[str] = None


class ExtractedTableSummary(BaseModel):
    table_id: str
    name: str
    page_number: int = 1
    page_range: Optional[str] = None
    rows: int
    cols: int
    headers: List[str] = Field(default_factory=list)
    extraction_method: str = "direct_parser"
    average_confidence: float = 100.0


class FileMetadataItem(BaseModel):
    filename: str
    file_type: str = "spreadsheet"
    file_size_bytes: int
    row_count: int = 0
    column_count: int = 0
    extraction_confidence: float = 100.0
    has_handwritten_content: bool = False


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    file_format: str
    file_type: str = "spreadsheet"
    total_files_count: int = 1
    files_summary: List[FileMetadataItem] = Field(default_factory=list)
    total_pages: int = 1
    tables_extracted: int = 1
    extraction_confidence: float = 100.0
    has_handwritten_content: bool = False
    uncertain_fields_count: int = 0
    uncertain_fields: List[UncertainFieldModel] = Field(default_factory=list)
    tables_summary: List[ExtractedTableSummary] = Field(default_factory=list)
    extraction_log: List[str] = Field(default_factory=list)
    columns: List[ColumnDetail] = Field(default_factory=list)
    numeric_columns: List[str] = Field(default_factory=list)
    categorical_columns: List[str] = Field(default_factory=list)
    datetime_columns: List[str] = Field(default_factory=list)
    id_columns: List[str] = Field(default_factory=list)
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)
    health: Optional[HealthScoreResponse] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str = "Dataset uploaded successfully"


class ExtractionAuditResponse(BaseModel):
    overall_confidence: float = 100.0
    has_handwritten_content: bool = False
    uncertain_fields_count: int = 0
    uncertain_fields: List[UncertainFieldModel] = Field(default_factory=list)


class HealthScoreResponse(BaseModel):
    health_score: float
    quality_grade: str
    total_rows: int
    duplicate_rows_count: int
    total_missing_cells: int
    missing_cell_percentage: float
    issues_summary: List[str]
    extraction_audit: Optional[ExtractionAuditResponse] = None


class DatasetMetadataResponse(BaseModel):
    dataset_id: str
    filename: str
    file_type: str = "spreadsheet"
    total_pages: int = 1
    total_rows: int
    total_columns: int
    columns: List[ColumnDetail]
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    id_columns: List[str]
    health: HealthScoreResponse
