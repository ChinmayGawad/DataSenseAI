"""
Column Inspector: Automatic detection of column roles, data types, and semantic properties.
Used by Agent 1 (Data Detective) to understand unknown spreadsheets.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np


class ColumnMetadata:
    def __init__(
        self,
        name: str,
        detected_type: str,
        pandas_dtype: str,
        unique_count: int,
        null_count: int,
        null_percentage: float,
        is_id: bool = False,
        is_date: bool = False,
        is_numeric: bool = False,
        is_categorical: bool = False,
        sample_values: List[Any] = None,
        suggested_role: str = "feature"
    ):
        self.name = name
        self.detected_type = detected_type
        self.pandas_dtype = pandas_dtype
        self.unique_count = unique_count
        self.null_count = null_count
        self.null_percentage = round(null_percentage, 2)
        self.is_id = is_id
        self.is_date = is_date
        self.is_numeric = is_numeric
        self.is_categorical = is_categorical
        self.sample_values = sample_values or []
        self.suggested_role = suggested_role

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "detected_type": self.detected_type,
            "pandas_dtype": self.pandas_dtype,
            "unique_count": self.unique_count,
            "null_count": self.null_count,
            "null_percentage": self.null_percentage,
            "is_id": self.is_id,
            "is_date": self.is_date,
            "is_numeric": self.is_numeric,
            "is_categorical": self.is_categorical,
            "sample_values": self.sample_values[:5],
            "suggested_role": self.suggested_role,
        }


def detect_column_types(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes all columns of a dataframe and infers semantic data types, roles,
    and suitability for visualization and ML modeling.
    """
    total_rows = len(df)
    columns_info: List[Dict[str, Any]] = []
    
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []
    id_cols = []

    for col in df.columns:
        series = df[col]
        null_count = int(series.isna().sum())
        null_pct = (null_count / total_rows * 100) if total_rows > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        pandas_dtype = str(series.dtype)
        
        non_null_samples = series.dropna().head(10).tolist()
        sample_display = [str(x) if not pd.isna(x) else None for x in non_null_samples]

        is_id = False
        is_date = False
        is_numeric = False
        is_categorical = False
        detected_type = "string"
        suggested_role = "feature"

        col_lower = str(col).lower()

        # Check if ID
        if (
            (unique_count == total_rows and total_rows > 5)
            or "id" in col_lower
            or "uuid" in col_lower
            or "code" in col_lower
            or "key" in col_lower
        ) and (unique_count / max(total_rows, 1) > 0.85):
            is_id = True
            detected_type = "identifier"
            suggested_role = "identifier"
            id_cols.append(col)

        # Check Date / Datetime
        elif pd.api.types.is_datetime64_any_dtype(series):
            is_date = True
            detected_type = "datetime"
            suggested_role = "time_dimension"
            datetime_cols.append(col)
        else:
            # Try date parsing on sample if string or object
            if (pd.api.types.is_string_dtype(series) or series.dtype == "object") and not series.empty:
                sample_series = series.dropna().head(20)
                try:
                    parsed = pd.to_datetime(sample_series, errors="coerce", format="mixed")
                    if parsed.notna().sum() / max(len(sample_series), 1) >= 0.7:
                        is_date = True
                        detected_type = "datetime"
                        suggested_role = "time_dimension"
                        datetime_cols.append(col)
                except Exception:
                    pass

        # Check Numeric (if not already date or ID)
        if not is_date and not is_id:
            if pd.api.types.is_numeric_dtype(series):
                is_numeric = True
                if (
                    unique_count <= 10
                    and total_rows > 20
                    and not ("amount" in col_lower or "price" in col_lower or "salary" in col_lower or "cost" in col_lower)
                ):
                    # Low cardinality numeric can act as categorical (e.g., status codes, ratings)
                    is_categorical = True
                    detected_type = "categorical_numeric"
                    suggested_role = "dimension"
                    categorical_cols.append(col)
                else:
                    detected_type = "float" if pd.api.types.is_float_dtype(series) else "integer"
                    suggested_role = "metric"
                    numeric_cols.append(col)
            elif series.dtype == "bool":
                detected_type = "boolean"
                is_categorical = True
                suggested_role = "dimension"
                categorical_cols.append(col)
            else:
                # String / Categorical / Free-form Text
                is_categorical = True
                detected_type = "categorical"
                suggested_role = "dimension"
                categorical_cols.append(col)

        col_meta = ColumnMetadata(
            name=str(col),
            detected_type=detected_type,
            pandas_dtype=pandas_dtype,
            unique_count=unique_count,
            null_count=null_count,
            null_percentage=null_pct,
            is_id=is_id,
            is_date=is_date,
            is_numeric=is_numeric,
            is_categorical=is_categorical,
            sample_values=sample_display,
            suggested_role=suggested_role,
        )
        columns_info.append(col_meta.to_dict())

    return {
        "total_rows": total_rows,
        "total_columns": len(df.columns),
        "columns": columns_info,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
        "id_columns": id_cols,
    }
