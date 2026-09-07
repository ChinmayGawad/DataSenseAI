"""
Agent 6 — Visualization Architect 📊
Job: Design dynamic dashboard layout and provide "Why did AI choose this chart?" rationale.
"""

from typing import Dict, Any, List
from .base import call_llm


def run_visualization_architect(
    charts: List[Dict[str, Any]],
    columns_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes Agent 6 (Visualization Architect) to organize and justify dashboard charts.
    """
    charts_summary = [
        {"id": c.get("id"), "title": c.get("title"), "type": c.get("type"), "why": c.get("why_chosen")}
        for c in charts
    ]

    prompt = f"""
    You are the Visualization Architect agent for DataSense AI.
    Review the auto-selected charts:
    {charts_summary}

    Provide a brief rationale explaining how this dashboard layout optimizes cognitive load for executive decision-makers.
    Respond in JSON:
    {{
        "dashboard_concept": "string",
        "narrative_flow": "string"
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are Agent 6 (Visualization Architect), an expert in information design.")

    if not llm_res:
        llm_res = {
            "dashboard_concept": f"Adaptive Self-Designing Dashboard featuring {len(charts)} specialized visual components.",
            "narrative_flow": "Structured hierarchically from macro longitudinal trends down to granular categorical breakdowns and multivariate clusters."
        }

    return {
        "agent": "Visualization Architect 📊",
        "status": "completed",
        "dashboard_concept": llm_res["dashboard_concept"],
        "narrative_flow": llm_res["narrative_flow"],
        "total_charts_configured": len(charts),
        "charts": charts
    }
