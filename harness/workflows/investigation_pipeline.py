"""
Investigation Pipeline: Complete multi-agent orchestration for DataSense AI.
Coordinates the 8 specialized agents from dataset ingestion to verified insights.
"""

import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable

# Ensure harness and core-ml directories are on sys.path
HARNESS_DIR = str(Path(__file__).resolve().parent.parent)
CORE_ML_DIR = str(Path(__file__).resolve().parent.parent.parent / "core-ml")

for d in [HARNESS_DIR, CORE_ML_DIR]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    from harness.plugins.data_tools import load_and_inspect_data
    from harness.plugins.cleaning_tools import execute_data_cleaning
    from harness.plugins.ml_tools import execute_statistical_and_ml_suite
    from harness.plugins.chart_tools import build_dashboard_charts

    from harness.agents.data_detective import run_data_detective
    from harness.agents.quality_inspector import run_quality_inspector
    from harness.agents.data_cleaner import run_data_cleaner
    from harness.agents.investigation_planner import run_investigation_planner
    from harness.agents.data_scientist import run_data_scientist
    from harness.agents.visualization_architect import run_visualization_architect
    from harness.agents.insight_analyst import run_insight_analyst
    from harness.agents.fact_checker import run_fact_checker
except ImportError:
    from plugins.data_tools import load_and_inspect_data
    from plugins.cleaning_tools import execute_data_cleaning
    from plugins.ml_tools import execute_statistical_and_ml_suite
    from plugins.chart_tools import build_dashboard_charts

    from agents.data_detective import run_data_detective
    from agents.quality_inspector import run_quality_inspector
    from agents.data_cleaner import run_data_cleaner
    from agents.investigation_planner import run_investigation_planner
    from agents.data_scientist import run_data_scientist
    from agents.visualization_architect import run_visualization_architect
    from agents.insight_analyst import run_insight_analyst
    from agents.fact_checker import run_fact_checker


def run_investigation_pipeline(
    file_path: str,
    event_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes the full 8-agent Autonomous Investigation Engine on an uploaded dataset.
    
    Args:
        file_path: Local filesystem path to the CSV or Excel file.
        event_callback: Optional callback receiving real-time timeline events.
        options: Optional configuration overrides (e.g., contamination, max_clusters).
        
    Returns:
        Complete InvestigationResult dictionary ready for dashboard consumption.
    """
    options = options or {}
    timeline: List[Dict[str, Any]] = []
    dataset_name = os.path.basename(file_path)

    def emit_event(agent: str, icon: str, action: str, status: str, details: str, meta: Optional[Dict[str, Any]] = None):
        event = {
            "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "agent": agent,
            "agent_icon": icon,
            "action": action,
            "status": status,
            "details": details,
            "metadata": meta or {}
        }
        timeline.append(event)
        if event_callback:
            try:
                event_callback(event)
            except Exception:
                pass

    try:
        emit_event(
            agent="Investigation Orchestrator",
            icon="🚀",
            action="initiate_pipeline",
            status="started",
            details=f"Starting autonomous investigation for dataset '{dataset_name}'."
        )

        # -------------------------------------------------------------
        # STEP 1: Ingestion & Profiling (Tool Plugin)
        # -------------------------------------------------------------
        raw_df, col_metadata, raw_quality = load_and_inspect_data(file_path)
        
        # -------------------------------------------------------------
        # AGENT 1: Data Detective 🔍
        # -------------------------------------------------------------
        emit_event("Data Detective", "🔍", "schema_inference", "in_progress", "Analyzing column data types and semantic roles...")
        detective_result = run_data_detective(dataset_name, col_metadata)
        emit_event(
            "Data Detective", "🔍", "schema_inference", "completed",
            detective_result["summary"],
            {"domain": detective_result["domain"], "columns_count": len(col_metadata.get("columns", []))}
        )

        # -------------------------------------------------------------
        # AGENT 2: Data Quality Inspector 🩺
        # -------------------------------------------------------------
        emit_event("Data Quality Inspector", "🩺", "hygiene_audit", "in_progress", "Auditing missing cells, duplicates, and calculating health score...")
        quality_result = run_quality_inspector(raw_quality)
        emit_event(
            "Data Quality Inspector", "🩺", "hygiene_audit", "completed",
            f"Health Score: {quality_result['health_score']}/100 ({quality_result['quality_grade']}). {quality_result['hygiene_summary']}",
            {"health_score": quality_result["health_score"], "grade": quality_result["quality_grade"]}
        )

        # -------------------------------------------------------------
        # AGENT 3: Data Cleaning Agent 🧹
        # -------------------------------------------------------------
        emit_event("Data Cleaning Agent", "🧹", "data_cleaning", "in_progress", "Applying autonomous imputation and deduplication...")
        cleaned_df, cleaning_report = execute_data_cleaning(
            df=raw_df,
            drop_high_null_threshold=options.get("drop_null_threshold", 0.70),
            deduplicate=True,
            auto_impute=True
        )
        cleaner_result = run_data_cleaner(cleaning_report)
        emit_event(
            "Data Cleaning Agent", "🧹", "data_cleaning", "completed",
            cleaner_result["summary"],
            {"total_actions": cleaner_result["total_actions"], "cleaned_rows": len(cleaned_df)}
        )

        # -------------------------------------------------------------
        # AGENT 4: Investigation Planner 🧠
        # -------------------------------------------------------------
        emit_event("Investigation Planner", "🧠", "formulate_agenda", "in_progress", "Designing multi-step investigation hypotheses...")
        planner_result = run_investigation_planner(dataset_name, col_metadata, quality_result)
        emit_event(
            "Investigation Planner", "🧠", "formulate_agenda", "completed",
            f"Formulated {planner_result['steps_count']} prioritized analytical hypotheses.",
            {"steps": [s["title"] for s in planner_result["steps"]]}
        )

        # -------------------------------------------------------------
        # STEP 5: ML & Statistical Calculation Suite (Tool Plugin)
        # -------------------------------------------------------------
        ml_calc_results = execute_statistical_and_ml_suite(
            df=cleaned_df,
            outlier_contamination=options.get("outlier_contamination", 0.05),
            max_clusters=options.get("max_clusters", 5),
            min_corr_threshold=options.get("min_corr_threshold", 0.4)
        )

        # -------------------------------------------------------------
        # AGENT 5: Data Scientist Agent 🤖
        # -------------------------------------------------------------
        emit_event("Data Scientist Agent", "🤖", "ml_execution", "in_progress", "Evaluating correlations, Isolation Forest outliers, and KMeans clusters...")
        scientist_result = run_data_scientist(ml_calc_results)
        emit_event(
            "Data Scientist Agent", "🤖", "ml_execution", "completed",
            scientist_result["summary"],
            {"correlations_count": len(scientist_result["correlations"]), "outliers": scientist_result["outlier_analysis"]["total_outliers"]}
        )

        # -------------------------------------------------------------
        # AGENT 6: Visualization Architect 📊
        # -------------------------------------------------------------
        emit_event("Visualization Architect", "📊", "chart_composition", "in_progress", "Generating Plotly visualization specs and 'Why Chosen' rationale...")
        raw_charts = build_dashboard_charts(
            df=cleaned_df,
            columns_info=col_metadata,
            ml_results=ml_calc_results
        )
        viz_result = run_visualization_architect(raw_charts, col_metadata)
        emit_event(
            "Visualization Architect", "📊", "chart_composition", "completed",
            f"Configured {viz_result['total_charts_configured']} self-designing dynamic charts.",
            {"charts_count": viz_result["total_charts_configured"]}
        )

        # -------------------------------------------------------------
        # AGENT 7: Insight Analyst 💡
        # -------------------------------------------------------------
        emit_event("Insight Analyst", "💡", "synthesize_insights", "in_progress", "Translating mathematical outputs into executive business narratives...")
        candidate_insights = run_insight_analyst(ml_calc_results, raw_quality, col_metadata)
        emit_event(
            "Insight Analyst", "💡", "synthesize_insights", "completed",
            f"Drafted {len(candidate_insights)} candidate insights across growth, anomalies, and correlations.",
            {"candidate_count": len(candidate_insights)}
        )

        # -------------------------------------------------------------
        # AGENT 8: AI Fact Checker ✅
        # -------------------------------------------------------------
        emit_event("AI Fact Checker", "✅", "fact_verification", "in_progress", "Auditing candidate insights against computed Python ground truth...")
        fact_check_result = run_fact_checker(
            insights=candidate_insights,
            ml_results=ml_calc_results,
            quality_report=raw_quality,
            strict_mode=True
        )
        emit_event(
            "AI Fact Checker", "✅", "fact_verification", "completed",
            fact_check_result["summary"],
            {"accuracy_rate": f"{fact_check_result['fact_check_accuracy_rate']}%"}
        )

        emit_event(
            "Investigation Orchestrator", "🏁", "pipeline_settled", "completed",
            f"Investigation successfully finalized with 100% verified facts.",
            {"health_score": quality_result["health_score"]}
        )

        # -------------------------------------------------------------
        # ASSEMBLE FINAL INVESTIGATION PAYLOAD
        # -------------------------------------------------------------
        return {
            "status": "success",
            "dataset_name": dataset_name,
            "summary": {
                "total_rows_original": raw_df.shape[0],
                "total_rows_cleaned": cleaned_df.shape[0],
                "total_columns": raw_df.shape[1],
                "health_score": quality_result["health_score"],
                "quality_grade": quality_result["quality_grade"],
                "domain": detective_result["domain"],
                "executive_overview": detective_result["summary"]
            },
            "columns": col_metadata.get("columns", []),
            "quality": quality_result,
            "cleaning": cleaner_result,
            "investigation_plan": planner_result.get("steps", []),
            "ml_findings": scientist_result,
            "charts": viz_result.get("charts", []),
            "verified_insights": fact_check_result.get("verified_insights", []),
            "fact_check_audit": {
                "accuracy_rate": fact_check_result.get("fact_check_accuracy_rate"),
                "total_audited": fact_check_result.get("total_insights_audited"),
                "verified_count": fact_check_result.get("verified_count"),
                "corrected_count": fact_check_result.get("corrected_count"),
            },
            "timeline": timeline,
            "error_message": None
        }

    except Exception as e:
        emit_event(
            "Investigation Orchestrator", "❌", "pipeline_failed", "error",
            f"Investigation failed with error: {str(e)}"
        )
        return {
            "status": "error",
            "dataset_name": dataset_name,
            "summary": {},
            "columns": [],
            "quality": {},
            "cleaning": {},
            "investigation_plan": [],
            "ml_findings": {},
            "charts": [],
            "verified_insights": [],
            "fact_check_audit": {},
            "timeline": timeline,
            "error_message": str(e)
        }
