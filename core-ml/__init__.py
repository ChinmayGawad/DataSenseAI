"""
DataSense AI - Core ML & Statistical Tools
Pure Python numerical and analytical engine completely decoupled from LLMs.
Handles facts and mathematical calculations to guarantee hallucination-free reasoning.
"""

from .column_inspector import detect_column_types, ColumnMetadata
from .quality_inspector import inspect_data_quality, QualityReport
from .cleaning_engine import clean_dataset, CleaningReport
from .statistical_engine import generate_summary_stats, calculate_correlations
from .anomaly_detector import detect_outliers, OutlierReport
from .clustering_engine import run_clustering, ClusteringReport
from .chart_engine import (
    build_bar_chart,
    build_line_chart,
    build_scatter_chart,
    build_heatmap_chart,
    build_cluster_chart,
)

__all__ = [
    "detect_column_types",
    "ColumnMetadata",
    "inspect_data_quality",
    "QualityReport",
    "clean_dataset",
    "CleaningReport",
    "generate_summary_stats",
    "calculate_correlations",
    "detect_outliers",
    "OutlierReport",
    "run_clustering",
    "ClusteringReport",
    "build_bar_chart",
    "build_line_chart",
    "build_scatter_chart",
    "build_heatmap_chart",
    "build_cluster_chart",
]
