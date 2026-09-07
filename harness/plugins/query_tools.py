"""
Query Plugin: Deterministic natural language translation to Pandas operations.
Executes calculations directly in Python to prevent mathematical hallucination.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
import pandas as pd
import numpy as np


def execute_natural_query(
    df: pd.DataFrame,
    question: str
) -> Dict[str, Any]:
    """
    Parses a user question, maps it to column attributes, executes the aggregation,
    and returns exact numerical metrics and tabular evidence.
    """
    q_lower = question.lower()
    cols = list(df.columns)
    col_map = {str(c).lower(): c for c in cols}

    num_cols = list(df.select_dtypes(include=[np.number]).columns)
    cat_cols = [
        c for c in cols
        if not pd.api.types.is_numeric_dtype(df[c])
        and not pd.api.types.is_datetime64_any_dtype(df[c])
        and "date" not in str(c).lower()
        and "id" not in str(c).lower()
    ]
    date_cols = [c for c in cols if pd.api.types.is_datetime64_any_dtype(df[c]) or "date" in str(c).lower()]

    # 1. Identify target metric column
    target_metric = None
    for c_low, c_orig in col_map.items():
        if c_low in q_lower and c_orig in num_cols:
            target_metric = c_orig
            break
    if not target_metric and num_cols:
        target_metric = num_cols[0]

    # 2. Identify target dimension column
    target_dim = None
    for c_low, c_orig in col_map.items():
        if c_low in q_lower and c_orig in cat_cols:
            target_dim = c_orig
            break
    if not target_dim and cat_cols:
        target_dim = cat_cols[0]

    # 3. Detect Aggregation Intent
    agg_op = "mean"
    if any(w in q_lower for w in ["total", "sum", "overall", "aggregate"]):
        agg_op = "sum"
    elif any(w in q_lower for w in ["max", "highest", "top", "maximum", "peak"]):
        agg_op = "max"
    elif any(w in q_lower for w in ["min", "lowest", "bottom", "minimum", "least"]):
        agg_op = "min"
    elif any(w in q_lower for w in ["count", "how many", "number of"]):
        agg_op = "count"
    elif any(w in q_lower for w in ["avg", "average", "mean"]):
        agg_op = "mean"

    # 4. Filter detection (check if any specific category value mentioned)
    active_filter = None
    if cat_cols:
        for c in cat_cols:
            unique_vals = df[c].dropna().unique()
            for u in unique_vals:
                if str(u).lower() in q_lower:
                    active_filter = (c, u)
                    break
            if active_filter:
                break

    working_df = df.copy()
    if active_filter:
        working_df = working_df[working_df[active_filter[0]] == active_filter[1]]

    result_data: Dict[str, Any] = {}
    
    if target_dim and target_metric and (target_dim in working_df.columns) and (target_metric in working_df.columns):
        if agg_op == "sum":
            grouped = working_df.groupby(target_dim)[target_metric].sum().reset_index()
        elif agg_op == "count":
            grouped = working_df.groupby(target_dim)[target_metric].count().reset_index()
        elif agg_op == "max":
            grouped = working_df.groupby(target_dim)[target_metric].max().reset_index()
        elif agg_op == "min":
            grouped = working_df.groupby(target_dim)[target_metric].min().reset_index()
        else:
            grouped = working_df.groupby(target_dim)[target_metric].mean().reset_index()

        ascending = (agg_op == "min")
        grouped = grouped.sort_values(by=target_metric, ascending=ascending)

        top_row = grouped.iloc[0] if len(grouped) > 0 else None
        top_name = str(top_row[target_dim]) if top_row is not None else "N/A"
        top_val = round(float(top_row[target_metric]), 2) if top_row is not None else 0.0

        table_records = grouped.head(10).to_dict(orient="records")
        for r in table_records:
            for k, v in r.items():
                if isinstance(v, (np.floating, float)):
                    r[k] = round(float(v), 2)

        result_data = {
            "query_type": "grouped_aggregation",
            "dimension": target_dim,
            "metric": target_metric,
            "operation": agg_op,
            "filter_applied": f"{active_filter[0]} = '{active_filter[1]}'" if active_filter else None,
            "leader_entity": top_name,
            "calculated_value": top_val,
            "table": table_records
        }
    elif target_metric and target_metric in working_df.columns:
        s = working_df[target_metric].dropna()
        if agg_op == "sum":
            val = float(s.sum())
        elif agg_op == "count":
            val = float(s.count())
        elif agg_op == "max":
            val = float(s.max())
        elif agg_op == "min":
            val = float(s.min())
        else:
            val = float(s.mean())

        val = round(val, 2)
        result_data = {
            "query_type": "scalar_metric",
            "metric": target_metric,
            "operation": agg_op,
            "filter_applied": f"{active_filter[0]} = '{active_filter[1]}'" if active_filter else None,
            "calculated_value": val,
            "table": [{"Metric": f"{agg_op.capitalize()} of {target_metric}", "Value": val}]
        }
    else:
        # Generic record count
        val = len(working_df)
        result_data = {
            "query_type": "row_count",
            "operation": "count",
            "filter_applied": f"{active_filter[0]} = '{active_filter[1]}'" if active_filter else None,
            "calculated_value": val,
            "table": [{"Metric": "Total Records", "Value": val}]
        }

    return result_data
