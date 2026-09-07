"""
Agent 2 — Data Quality Inspector 🩺
Job: Assess hygiene, missing values, duplicate records, and calculate Dataset Health Score.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_quality_inspector(
    quality_report: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes Agent 2 (Data Quality Inspector) to audit data hygiene.
    """
    health_score = quality_report.get("health_score", 100.0)
    grade = quality_report.get("quality_grade", "A")
    missing_cells = quality_report.get("total_missing_cells", 0)
    missing_pct = quality_report.get("missing_cell_percentage", 0.0)
    dup_rows = quality_report.get("duplicate_rows_count", 0)
    issues = quality_report.get("issues_summary", [])
    cols_with_missing = quality_report.get("columns_with_missing", [])
    const_cols = quality_report.get("constant_columns", [])

    prompt = f"""
    You are the Data Quality Inspector agent for DataSense AI.
    Audit data hygiene metrics:
    Health Score: {health_score}/100 ({grade})
    Missing Cells: {missing_cells} ({missing_pct}%)
    Duplicate Rows: {dup_rows}
    Constant Columns: {const_cols}
    Identified Issues: {issues}

    Provide a concise clinical diagnosis of dataset health and whether it requires automated cleaning before ML modeling.
    Respond with JSON:
    {{
        "hygiene_summary": "string",
        "cleaning_recommended": true,
        "critical_warnings": ["string"]
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are Agent 2 (Data Quality Inspector), a rigorous data quality auditor.")

    if not llm_res:
        cleaning_needed = (missing_cells > 0 or dup_rows > 0 or len(const_cols) > 0)
        warning_list = []
        if missing_pct > 15:
            warning_list.append(f"High missingness rate ({missing_pct}%) requires automated imputation.")
        if dup_rows > 0:
            warning_list.append(f"Contains {dup_rows} duplicate records that should be pruned.")
        if const_cols:
            warning_list.append(f"Columns {const_cols} contain zero variance.")

        summary_text = (
            f"Dataset scored {health_score}/100 ({grade}). "
            + (f"Found {missing_cells} missing values across {len(cols_with_missing)} columns and {dup_rows} duplicate rows."
               if (missing_cells > 0 or dup_rows > 0) else "Dataset exhibits pristine data hygiene.")
        )
        llm_res = {
            "hygiene_summary": summary_text,
            "cleaning_recommended": cleaning_needed,
            "critical_warnings": warning_list
        }

    return {
        "agent": "Data Quality Inspector 🩺",
        "status": "completed",
        "health_score": health_score,
        "quality_grade": grade,
        "hygiene_summary": llm_res["hygiene_summary"],
        "cleaning_recommended": llm_res["cleaning_recommended"],
        "critical_warnings": llm_res.get("critical_warnings", []),
        "constant_columns": const_cols,
        "duplicate_rows_count": dup_rows,
        "total_missing_cells": missing_cells,
        "missing_cell_percentage": missing_pct,
        "details": {
            "total_missing_cells": missing_cells,
            "missing_cell_percentage": missing_pct,
            "duplicate_rows_count": dup_rows,
            "columns_with_missing": cols_with_missing,
            "constant_columns": const_cols,
            "all_issues": issues
        }
    }
