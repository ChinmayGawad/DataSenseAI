"""
Dataset Profiler & Semantic Classifier:
Analyzes datasets to infer true semantic types, detect identifier columns,
and construct the Dataset Fingerprint context for the Why? Engine.
"""

from typing import Dict, Any, List, Optional
import re
import pandas as pd
import numpy as np


class DatasetFingerprint:
    def __init__(
        self,
        total_rows: int,
        total_columns: int,
        numeric_count: int,
        categorical_count: int,
        date_count: int,
        identifier_count: int,
        missing_percentage: float,
        duplicate_count: int,
        data_quality_score: float,
        detected_domain: str,
        domain_confidence: float,
        column_profiles: List[Dict[str, Any]],
        metric_columns: List[str],
        dimension_columns: List[str],
        time_columns: List[str],
        identifier_columns: List[str],
    ):
        self.total_rows = total_rows
        self.total_columns = total_columns
        self.numeric_count = numeric_count
        self.categorical_count = categorical_count
        self.date_count = date_count
        self.identifier_count = identifier_count
        self.missing_percentage = missing_percentage
        self.duplicate_count = duplicate_count
        self.data_quality_score = data_quality_score
        self.detected_domain = detected_domain
        self.domain_confidence = domain_confidence
        self.column_profiles = column_profiles
        self.metric_columns = metric_columns
        self.dimension_columns = dimension_columns
        self.time_columns = time_columns
        self.identifier_columns = identifier_columns

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_rows": self.total_rows,
            "total_columns": self.total_columns,
            "numeric_count": self.numeric_count,
            "categorical_count": self.categorical_count,
            "date_count": self.date_count,
            "identifier_count": self.identifier_count,
            "missing_percentage": round(self.missing_percentage, 2),
            "duplicate_count": self.duplicate_count,
            "data_quality_score": round(self.data_quality_score, 1),
            "detected_domain": self.detected_domain,
            "domain_confidence": round(self.domain_confidence, 1),
            "column_profiles": self.column_profiles,
            "metric_columns": self.metric_columns,
            "dimension_columns": self.dimension_columns,
            "time_columns": self.time_columns,
            "identifier_columns": self.identifier_columns,
        }


# Domain keyword signatures for domain detection
DOMAIN_SIGNATURES = {
    "E-Commerce / Retail": [
        "sales", "revenue", "price", "order", "product", "sku", "category",
        "cart", "customer", "discount", "profit", "shipping", "quantity", "return", "cancellation"
    ],
    "Healthcare / Clinical": [
        "patient", "diagnosis", "admission", "discharge", "dosage", "treatment",
        "blood_pressure", "heart_rate", "glucose", "age", "bmi", "hospital", "doctor", "symptom"
    ],
    "Marketing / Growth": [
        "campaign", "impressions", "clicks", "ctr", "cpc", "conversions",
        "lead", "channel", "ad_spend", "cac", "roas", "funnel", "bounce_rate"
    ],
    "SaaS / Subscription": [
        "mrr", "arr", "churn", "renewal", "subscription", "plan", "seat",
        "usage", "ltv", "dau", "mau", "retention", "nps", "tier"
    ],
    "Finance / Banking": [
        "account", "balance", "transaction", "loan", "interest", "credit",
        "debit", "deposit", "portfolio", "risk", "yield", "default", "asset"
    ],
    "Supply Chain / Logistics": [
        "inventory", "warehouse", "freight", "delivery", "transit", "carrier",
        "supplier", "stock", "lead_time", "fulfillment", "tracking", "route"
    ]
}

IDENTIFIER_PATTERNS = [
    r"^id$", r".*_id$", r"^id_.*", r"^uuid$", r".*_uuid$",
    r"^code$", r".*_code$", r"^key$", r".*_key$",
    r"^customer_id$", r"^transaction_id$", r"^order_id$", r"^employee_id$",
    r"^pincode$", r"^zip_code$", r"^postal_code$", r"^phone.*", r"^ssn$"
]


def is_identifier_column(series: pd.Series, col_name: str, total_rows: int) -> bool:
    """
    Determines if a column is an identifier based on naming conventions and cardinality.
    Semantic IDs must NEVER be treated as continuous metrics or driver dimensions.
    """
    col_lower = str(col_name).strip().lower()

    # 1. Regex pattern match
    for pattern in IDENTIFIER_PATTERNS:
        if re.match(pattern, col_lower):
            return True

    # 2. Check unique ratio for moderate-to-large datasets
    if total_rows > 10:
        unique_count = int(series.nunique(dropna=True))
        unique_ratio = unique_count / max(total_rows, 1)

        # High cardinality non-numeric string
        if unique_ratio > 0.85 and (series.dtype == "object" or pd.api.types.is_string_dtype(series)):
            return True

        # Strictly sequential unique integer (like row IDs 1, 2, 3...)
        if pd.api.types.is_integer_dtype(series) and unique_count == total_rows:
            clean_s = series.dropna().sort_values()
            if len(clean_s) > 1 and (clean_s.diff().dropna() == 1).all():
                return True

    return False


def is_datetime_column(series: pd.Series) -> bool:
    """
    Checks if a series contains temporal/date data.
    """
    if pd.api.types.is_datetime64_any_dtype(series):
        return True

    if series.dtype == "object" or pd.api.types.is_string_dtype(series):
        sample = series.dropna().head(20)
        if len(sample) == 0:
            return False
        try:
            parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
            if parsed.notna().sum() / max(len(sample), 1) >= 0.75:
                return True
        except Exception:
            pass

    return False


def profile_dataset(df: pd.DataFrame) -> DatasetFingerprint:
    """
    Generates a full semantic profile and fingerprint of the dataset.
    """
    total_rows = len(df)
    total_cols = len(df.columns)

    if total_rows == 0 or total_cols == 0:
        return DatasetFingerprint(
            total_rows=0, total_columns=0, numeric_count=0, categorical_count=0,
            date_count=0, identifier_count=0, missing_percentage=0.0, duplicate_count=0,
            data_quality_score=100.0, detected_domain="General Business", domain_confidence=50.0,
            column_profiles=[], metric_columns=[], dimension_columns=[], time_columns=[], identifier_columns=[]
        )

    column_profiles: List[Dict[str, Any]] = []
    metric_cols: List[str] = []
    dimension_cols: List[str] = []
    time_cols: List[str] = []
    id_cols: List[str] = []

    total_cells = total_rows * total_cols
    total_nulls = int(df.isna().sum().sum())
    missing_pct = (total_nulls / max(total_cells, 1)) * 100.0
    dup_count = int(df.duplicated().sum())

    for col in df.columns:
        series = df[col]
        col_name = str(col)
        col_lower = col_name.strip().lower()
        null_count = int(series.isna().sum())
        null_pct = (null_count / max(total_rows, 1)) * 100.0
        unique_count = int(series.nunique(dropna=True))

        semantic_type = "string"
        suggested_role = "dimension"
        sample_vals = [str(v) if not pd.isna(v) else None for v in series.dropna().head(5).tolist()]

        # 1. Identifier check
        if is_identifier_column(series, col_name, total_rows):
            semantic_type = "identifier"
            suggested_role = "identifier"
            id_cols.append(col_name)

        # 2. Date / Datetime check
        elif is_datetime_column(series):
            semantic_type = "datetime"
            suggested_role = "time_dimension"
            time_cols.append(col_name)

        # 3. Numeric check
        elif pd.api.types.is_numeric_dtype(series):
            # Low-cardinality numeric (e.g. status codes 1-4, ratings 1-5, binary 0/1)
            is_monetary_or_amount = any(kw in col_lower for kw in ["amount", "price", "sales", "revenue", "profit", "cost", "salary", "balance"])
            if unique_count <= 8 and total_rows > 20 and not is_monetary_or_amount:
                semantic_type = "categorical_numeric"
                suggested_role = "dimension"
                dimension_cols.append(col_name)
            else:
                semantic_type = "float" if pd.api.types.is_float_dtype(series) else "integer"
                suggested_role = "metric"
                metric_cols.append(col_name)

        # 4. Boolean check
        elif series.dtype == "bool":
            semantic_type = "boolean"
            suggested_role = "dimension"
            dimension_cols.append(col_name)

        # 5. Categorical String
        else:
            semantic_type = "categorical"
            suggested_role = "dimension"
            dimension_cols.append(col_name)

        column_profiles.append({
            "name": col_name,
            "semantic_type": semantic_type,
            "suggested_role": suggested_role,
            "pandas_dtype": str(series.dtype),
            "unique_count": unique_count,
            "null_count": null_count,
            "null_percentage": round(null_pct, 2),
            "sample_values": sample_vals
        })

    # Domain Detection Heuristic
    domain_scores: Dict[str, float] = {}
    col_names_joined = " ".join([str(c).lower() for c in df.columns])

    for domain, keywords in DOMAIN_SIGNATURES.items():
        matches = sum(1 for kw in keywords if kw in col_names_joined)
        score = (matches / len(keywords)) * 100.0
        domain_scores[domain] = score

    best_domain = max(domain_scores, key=domain_scores.get)
    best_score = domain_scores[best_domain]

    if best_score > 15.0:
        detected_domain = best_domain
        domain_confidence = min(95.0, 50.0 + best_score * 2.0)
    else:
        detected_domain = "General Business / Analytics"
        domain_confidence = 65.0

    # Data Quality Score (0-100)
    completeness_score = max(0.0, 100.0 - (missing_pct * 2.0))
    duplicate_penalty = min(20.0, (dup_count / max(total_rows, 1)) * 100.0)
    quality_score = max(10.0, min(100.0, completeness_score - duplicate_penalty))

    return DatasetFingerprint(
        total_rows=total_rows,
        total_columns=total_cols,
        numeric_count=len(metric_cols),
        categorical_count=len(dimension_cols),
        date_count=len(time_cols),
        identifier_count=len(id_cols),
        missing_percentage=missing_pct,
        duplicate_count=dup_count,
        data_quality_score=quality_score,
        detected_domain=detected_domain,
        domain_confidence=domain_confidence,
        column_profiles=column_profiles,
        metric_columns=metric_cols,
        dimension_columns=dimension_cols,
        time_columns=time_cols,
        identifier_columns=id_cols
    )
