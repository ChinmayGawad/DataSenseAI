"""
ML & Statistics Plugin: Runs descriptive stats, correlations, outlier detection, and clustering for Agent 5.
"""

import sys
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

CORE_ML_DIR = str(Path(__file__).resolve().parent.parent.parent / "core-ml")
if CORE_ML_DIR not in sys.path:
    sys.path.insert(0, CORE_ML_DIR)

import statistical_engine
import anomaly_detector
import clustering_engine


def execute_statistical_and_ml_suite(
    df: pd.DataFrame,
    outlier_contamination: float = 0.05,
    max_clusters: int = 5,
    min_corr_threshold: float = 0.4
) -> Dict[str, Any]:
    """
    Executes the full suite of statistical profiling and machine learning analyses.
    All facts are computed directly with pure Python tools.
    """
    summary_stats = statistical_engine.generate_summary_stats(df)
    correlations = statistical_engine.calculate_correlations(df, min_threshold=min_corr_threshold)
    outliers = anomaly_detector.detect_outliers(df, contamination=outlier_contamination)
    clustering = clustering_engine.run_clustering(df, max_k=max_clusters)

    return {
        "summary_stats": summary_stats,
        "correlations": correlations,
        "outliers": outliers,
        "clustering": clustering,
    }
