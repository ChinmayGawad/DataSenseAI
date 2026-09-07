"""
Data Exporter: Serializes cleaned tabular data and multi-agent audit logs into download-ready formats.
"""

import os
import json
import io
from typing import Dict, Any, Optional, Union
import pandas as pd


def export_cleaned_dataset(
    df: pd.DataFrame,
    export_format: str = "csv",
    output_path: Optional[str] = None
) -> Union[bytes, str]:
    """
    Serializes a cleaned pandas DataFrame to CSV, Parquet, or JSON.
    Returns bytes/string or writes to file if output_path is provided.
    """
    fmt = export_format.lower()

    if fmt == "csv":
        if output_path:
            df.to_csv(output_path, index=False, encoding="utf-8")
            return output_path
        return df.to_csv(index=False, encoding="utf-8").encode("utf-8")

    elif fmt == "parquet":
        buffer = io.BytesIO()
        df.to_parquet(buffer, index=False)
        bytes_data = buffer.getvalue()
        if output_path:
            with open(output_path, "wb") as f:
                f.write(bytes_data)
            return output_path
        return bytes_data

    elif fmt == "json":
        json_str = df.to_json(orient="records", date_format="iso", indent=2)
        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(json_str)
            return output_path
        return json_str.encode("utf-8")

    else:
        raise ValueError(f"Unsupported export format: '{export_format}'. Supported: csv, parquet, json")


def export_investigation_report_json(
    investigation_result: Dict[str, Any],
    output_path: Optional[str] = None
) -> str:
    """Serializes the complete investigation result dictionary into formatted JSON."""
    formatted = json.dumps(investigation_result, indent=2, default=str)
    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(formatted)
    return formatted


def export_cleaning_audit_markdown(
    cleaning_result: Dict[str, Any],
    dataset_name: str = "Dataset"
) -> str:
    """Generates a professional Markdown audit trail of all automated cleaning decisions."""
    lines = [
        f"# 🧹 DataSense AI — Automated Cleaning Audit Trail",
        f"**Target Dataset:** `{dataset_name}`",
        f"**Original Shape:** {cleaning_result.get('original_shape', {}).get('rows', 0)} rows, {cleaning_result.get('original_shape', {}).get('columns', 0)} columns",
        f"**Cleaned Shape:** {cleaning_result.get('cleaned_shape', {}).get('rows', 0)} rows, {cleaning_result.get('cleaned_shape', {}).get('columns', 0)} columns",
        f"**Total Automated Actions:** {cleaning_result.get('total_actions', 0)}",
        "",
        "## 📋 Transformation Log",
    ]

    imputations = cleaning_result.get("imputation_actions", [])
    if imputations:
        lines.append("### 1. Imputation Decisions")
        for idx, imp in enumerate(imputations, start=1):
            lines.append(f"- **Action {idx}: Column `{imp.get('column')}`**")
            lines.append(f"  - **Strategy:** `{imp.get('strategy')}` (fill value: `{imp.get('fill_value')}`)")
            lines.append(f"  - **Affected Cells:** {imp.get('missing_count')}")
            lines.append(f"  - **Mathematical Rationale:** {imp.get('reason')}")

    formattings = cleaning_result.get("formatting_actions", [])
    if formattings:
        lines.append("")
        lines.append("### 2. Normalization & Pruning")
        for idx, fmt in enumerate(formattings, start=1):
            lines.append(f"- **Action {idx}: {fmt.get('type')}**")
            lines.append(f"  - **Details:** {fmt.get('details')}")
            lines.append(f"  - **Rationale:** {fmt.get('reason')}")

    if cleaning_result.get("duplicates_removed", 0) > 0:
        lines.append("")
        lines.append(f"### 3. Deduplication")
        lines.append(f"- Purged **{cleaning_result['duplicates_removed']}** duplicate rows to eliminate distribution skew.")

    return "\n".join(lines)
