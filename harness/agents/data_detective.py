"""
Agent 1 — Data Detective 🔍
Job: Understand the dataset structure, classify columns, and detect semantic roles.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_data_detective(
    dataset_name: str,
    columns_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes Agent 1 (Data Detective) to inspect and classify dataset columns.
    """
    total_cols = columns_profile.get("total_columns", 0)
    total_rows = columns_profile.get("total_rows", 0)
    columns = columns_profile.get("columns", [])
    
    id_cols = columns_profile.get("id_columns", [])
    date_cols = columns_profile.get("datetime_columns", [])
    num_cols = columns_profile.get("numeric_columns", [])
    cat_cols = columns_profile.get("categorical_columns", [])

    prompt = f"""
    You are the Data Detective agent for DataSense AI.
    Analyze the following dataset metadata:
    Dataset Name: {dataset_name}
    Total Rows: {total_rows}
    Total Columns: {total_cols}
    Columns Metadata: {columns}
    
    Provide a concise summary explaining what this dataset contains, domain category, and primary target metric candidate.
    Respond with JSON format:
    {{
        "dataset_domain": "string",
        "description": "string",
        "primary_entity": "string",
        "key_metrics": ["string"],
        "key_dimensions": ["string"]
    }}
    """
    
    llm_res = call_llm(prompt, system_prompt="You are Agent 1 (Data Detective), an expert at understanding raw tabular schemas.")
    
    if not llm_res:
        # Heuristic determination
        domain = "Business / Analytics"
        if any("sale" in str(c).lower() or "price" in str(c).lower() or "rev" in str(c).lower() for c in num_cols):
            domain = "Commercial Sales & Revenue"
        elif any("patient" in str(c).lower() or "age" in str(c).lower() or "blood" in str(c).lower() for c in num_cols + cat_cols):
            domain = "Healthcare & Clinical Records"
        elif any("churn" in str(c).lower() or "campaign" in str(c).lower() or "click" in str(c).lower() for c in num_cols + cat_cols):
            domain = "Marketing & Customer Analytics"

        llm_res = {
            "dataset_domain": domain,
            "description": f"Dataset '{dataset_name}' contains {total_rows:,} records across {total_cols} attributes including {len(num_cols)} continuous metrics, {len(cat_cols)} categorical dimensions, and {len(date_cols)} temporal timestamps.",
            "primary_entity": id_cols[0] if id_cols else "Observation Record",
            "key_metrics": num_cols[:3],
            "key_dimensions": cat_cols[:3]
        }

    return {
        "agent": "Data Detective 🔍",
        "status": "completed",
        "summary": llm_res["description"],
        "domain": llm_res["dataset_domain"],
        "primary_entity": llm_res.get("primary_entity"),
        "key_metrics": llm_res.get("key_metrics", num_cols[:3]),
        "key_dimensions": llm_res.get("key_dimensions", cat_cols[:3]),
        "column_classification": {
            "identifiers": id_cols,
            "timestamps": date_cols,
            "metrics": num_cols,
            "dimensions": cat_cols,
        },
        "all_columns": columns
    }
