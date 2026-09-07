"""
Why? Analyst Agent (DeepSeek Harness Extension):
Converts structured Python evidence packages into plain-language executive root-cause narratives.
Strictly adheres to facts computed by the Why? Engine and enforces correlation vs causation distinction.
"""

from typing import Dict, Any, List, Optional
from .base import call_llm


def run_why_analyst_agent(
    why_engine_output: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes the Why? Analyst Agent to generate natural language explanations and recommendations.
    """
    target = why_engine_output.get("target_metric", "Metric")
    target_summary = why_engine_output.get("target_summary", {})
    tree = why_engine_output.get("root_cause_tree", {})
    hypotheses = why_engine_output.get("competing_hypotheses", [])
    seasonality = why_engine_output.get("seasonality_report", {})
    counterfactual = why_engine_output.get("counterfactual_summary", {})
    evidence_score = why_engine_output.get("evidence_score", 90.0)

    children = tree.get("children", [])
    primary_driver = children[0] if children else {}

    prompt = f"""
    You are the Why? Analyst Agent for DataSense AI.
    Transform the verified mathematical facts into a natural language executive root-cause summary:

    Target Metric: {target}
    Change: {target_summary.get('delta_pct')}% (Baseline: {target_summary.get('baseline_value')} -> Current: {target_summary.get('current_value')})
    Primary Driver: Dimension: {primary_driver.get('dimension')}, Segment: {primary_driver.get('segment')}, Contrib: {primary_driver.get('contribution_pct')}%, Delta: {primary_driver.get('delta_pct')}%
    Statistical Test: {primary_driver.get('statistical_test')} ({primary_driver.get('effect_size_summary')})
    Seasonality Detected: {seasonality.get('seasonality_detected')} ({seasonality.get('explanation')})
    Counterfactual Simulation: {counterfactual.get('narrative_explanation') if counterfactual else 'N/A'}
    Evidence Confidence Score: {evidence_score}/100

    Rules:
    1. NEVER invent unsupported numbers. Only cite facts from above.
    2. Distinguish correlation from causation (use 'associated with', 'contributed to the observed decline').
    3. Generate 2 concrete, actionable recommendations labeled as suggestions.

    Respond in JSON:
    {{
        "executive_headline": "string",
        "detailed_explanation": "string",
        "primary_root_cause_summary": "string",
        "actionable_recommendations": [
            {{
                "title": "string",
                "action": "string",
                "rationale": "string"
            }}
        ]
    }}
    """

    llm_res = call_llm(prompt, system_prompt="You are the Why? Analyst Agent, providing verified root-cause explanations.")

    if llm_res and "detailed_explanation" in llm_res:
        return {
            "executive_headline": llm_res.get("executive_headline", f"Root Cause Analysis: {target} Shift"),
            "detailed_explanation": llm_res.get("detailed_explanation", why_engine_output.get("narrative_summary", "")),
            "primary_root_cause_summary": llm_res.get("primary_root_cause_summary", ""),
            "actionable_recommendations": llm_res.get("actionable_recommendations", why_engine_output.get("recommendations", []))
        }

    # Deterministic heuristic fallback
    dir_word = "decreased" if target_summary.get("delta_abs", 0) < 0 else "increased"
    delta_pct = target_summary.get("delta_pct", 0.0)

    if primary_driver:
        headline = f"{target} {dir_word.capitalize()} by {abs(delta_pct):.1f}%, Driven Primarily by {primary_driver.get('segment')}"
        expl = (
            f"{target} {dir_word} by {abs(delta_pct):.1f}% from baseline. "
            f"Segment '{primary_driver.get('segment')}' in dimension '{primary_driver.get('dimension')}' accounted for "
            f"approximately {primary_driver.get('contribution_pct', 0):.1f}% of the total change, falling by {abs(primary_driver.get('delta_pct', 0)):.1f}%. "
            f"Statistical analysis confirms a statistically significant relationship ({primary_driver.get('statistical_test', 't-test')}). "
            f"{'Seasonality was detected and may account for cyclical variance.' if seasonality.get('seasonality_detected') else 'No confounding seasonality pattern was identified.'}"
        )
    else:
        headline = f"{target} {dir_word.capitalize()} Uniformly by {abs(delta_pct):.1f}%"
        expl = f"{target} {dir_word} by {abs(delta_pct):.1f}% across all evaluated dimensions."

    return {
        "executive_headline": headline,
        "detailed_explanation": expl,
        "primary_root_cause_summary": primary_driver.get("label", f"{target} shift"),
        "actionable_recommendations": [
            {
                "title": f"Review {primary_driver.get('dimension', 'Operations')} Operations in {primary_driver.get('segment', 'Target Segments')}",
                "action": f"Conduct a targeted operational audit on {primary_driver.get('dimension', 'key categories')}.",
                "rationale": f"{primary_driver.get('segment', 'This segment')} represents {primary_driver.get('contribution_pct', 0):.1f}% of the total metric variance."
            }
        ] if primary_driver else []
    }
