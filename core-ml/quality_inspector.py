"""
Quality Inspector: Evaluates data hygiene, missingness, duplicate records,
and calculates the overall Dataset Health Score (0-100%).
Used by Agent 2 (Data Quality Inspector).
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np


class QualityReport:
    def __init__(
        self,
        health_score: float,
        total_rows: int,
        duplicate_rows_count: int,
        total_missing_cells: int,
        missing_cell_percentage: float,
        columns_with_missing: List[Dict[str, Any]],
        constant_columns: List[str],
        issues_summary: List[str],
        quality_grade: str
    ):
        self.health_score = health_score
        self.total_rows = total_rows
        self.duplicate_rows_count = duplicate_rows_count
        self.total_missing_cells = total_missing_cells
        self.missing_cell_percentage = missing_cell_percentage
        self.columns_with_missing = columns_with_missing
        self.constant_columns = constant_columns
        self.issues_summary = issues_summary
        self.quality_grade = quality_grade

    def to_dict(self) -> Dict[str, Any]:
        return {
            "health_score": self.health_score,
            "quality_grade": self.quality_grade,
            "total_rows": self.total_rows,
            "duplicate_rows_count": self.duplicate_rows_count,
            "total_missing_cells": self.total_missing_cells,
            "missing_cell_percentage": round(self.missing_cell_percentage, 2),
            "columns_with_missing": self.columns_with_missing,
            "constant_columns": self.constant_columns,
            "issues_summary": self.issues_summary,
        }


def inspect_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Performs data quality audit and outputs health score (0-100) with clear issues log.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    total_cells = total_rows * total_cols if total_rows > 0 and total_cols > 0 else 1

    issues: List[str] = []
    
    # 1. Duplicate rows
    duplicate_rows = int(df.duplicated().sum()) if total_rows > 0 else 0
    if duplicate_rows > 0:
        dup_pct = round((duplicate_rows / total_rows) * 100, 1)
        issues.append(f"Found {duplicate_rows} duplicate rows ({dup_pct}% of total records).")

    # 2. Missing values analysis
    missing_by_col = df.isna().sum()
    total_missing = int(missing_by_col.sum())
    missing_cell_pct = (total_missing / total_cells) * 100

    cols_with_missing: List[Dict[str, Any]] = []
    for col, count in missing_by_col.items():
        if count > 0:
            pct = round((count / total_rows) * 100, 2)
            cols_with_missing.append({
                "column": str(col),
                "missing_count": int(count),
                "missing_percentage": pct
            })
            if pct > 40:
                issues.append(f"Column '{col}' has severe missingness ({pct}% empty).")
            elif pct > 10:
                issues.append(f"Column '{col}' has {count} missing values ({pct}%).")

    # 3. Constant or empty columns
    constant_cols = []
    for col in df.columns:
        if df[col].nunique(dropna=True) <= 1:
            constant_cols.append(str(col))
            issues.append(f"Column '{col}' has zero variance (constant or entirely empty).")

    # 4. Calculate Health Score (100 baseline)
    # Penalties:
    # - Missing values: up to 35 points penalty
    # - Duplicates: up to 25 points penalty
    # - Constant columns: up to 20 points penalty
    score = 100.0
    
    # Missing cells penalty (0% missing -> 0 penalty; 20% missing -> 25 penalty; 50% missing -> 35 penalty)
    missing_penalty = min(35.0, missing_cell_pct * 1.5)
    score -= missing_penalty

    # Duplicates penalty
    if total_rows > 0:
        dup_pct = (duplicate_rows / total_rows) * 100
        dup_penalty = min(25.0, dup_pct * 2.0)
        score -= dup_penalty

    # Constant columns penalty
    if total_cols > 0:
        const_pct = (len(constant_cols) / total_cols) * 100
        const_penalty = min(20.0, const_pct * 1.0)
        score -= const_penalty

    score = max(0.0, min(100.0, round(score, 1)))

    if score >= 90:
        grade = "Excellent (A)"
    elif score >= 75:
        grade = "Good (B)"
    elif score >= 60:
        grade = "Moderate (C)"
    elif score >= 40:
        grade = "Poor (D)"
    else:
        grade = "Critical (F)"

    if not issues:
        issues.append("Dataset is clean with zero missing values or duplicates detected.")

    report = QualityReport(
        health_score=score,
        total_rows=total_rows,
        duplicate_rows_count=duplicate_rows,
        total_missing_cells=total_missing,
        missing_cell_percentage=missing_cell_pct,
        columns_with_missing=cols_with_missing,
        constant_columns=constant_cols,
        issues_summary=issues,
        quality_grade=grade,
    )
    return report.to_dict()
