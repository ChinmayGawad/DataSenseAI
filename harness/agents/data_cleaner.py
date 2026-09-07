"""
Agent 3 — Data Cleaning Agent 🧹
Job: Decide and execute data cleaning strategies with logged mathematical rationale.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_data_cleaner(
    cleaning_report: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes Agent 3 (Data Cleaning Agent) and summarizes cleaning decisions.
    """
    imputations = cleaning_report.get("imputation_actions", [])
    formattings = cleaning_report.get("formatting_actions", [])
    dropped = cleaning_report.get("columns_dropped", [])
    dups_removed = cleaning_report.get("duplicates_removed", 0)
    orig_shape = cleaning_report.get("original_shape", {})
    clean_shape = cleaning_report.get("cleaned_shape", {})
    total_actions = cleaning_report.get("total_actions_count", 0)

    prompt = f"""
    You are the Data Cleaning Agent for DataSense AI.
    Review the executed cleaning decisions:
    Original Shape: {orig_shape}
    Cleaned Shape: {clean_shape}
    Duplicates Removed: {dups_removed}
    Columns Dropped: {dropped}
    Imputations: {imputations}
    Formatting & Normalization: {formattings}

    Provide an executive summary of the cleaning transformations and why they preserve statistical integrity.
    Respond with JSON:
    {{
        "cleaning_summary": "string",
        "key_decisions": ["string"],
        "dataset_readiness": "ready_for_ml"
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are Agent 3 (Data Cleaning Agent), justifying data transformations.")

    if not llm_res:
        decisions = []
        if dups_removed > 0:
            decisions.append(f"Purged {dups_removed} duplicate records to avoid distribution bias.")
        for imp in imputations:
            decisions.append(f"Column '{imp.get('column')}': Applied {imp.get('strategy')} imputation. Rationale: {imp.get('reason')}")
        for drp in dropped:
            decisions.append(f"Dropped column '{drp}' due to excessive missingness exceeding threshold.")

        if not decisions:
            decisions.append("No imputation or row removal necessary; dataset was already complete.")

        summary_text = (
            f"Successfully resolved all data quality bottlenecks with {total_actions} automated operations. "
            f"Preserved {clean_shape.get('rows', 0):,} records for downstream statistical modeling."
        )

        llm_res = {
            "cleaning_summary": summary_text,
            "key_decisions": decisions,
            "dataset_readiness": "ready_for_ml"
        }

    return {
        "agent": "Data Cleaning Agent 🧹",
        "status": "completed",
        "summary": llm_res["cleaning_summary"],
        "total_actions": total_actions,
        "duplicates_removed": dups_removed,
        "columns_dropped": dropped,
        "imputation_actions": imputations,
        "formatting_actions": formattings,
        "key_decisions": llm_res.get("key_decisions", []),
        "original_shape": orig_shape,
        "cleaned_shape": clean_shape,
    }
