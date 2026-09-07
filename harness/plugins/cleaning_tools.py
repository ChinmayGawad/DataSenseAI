"""
Cleaning Plugin: Executes automated cleaning, transformations, and audit logging for Agent 3.
"""

import sys
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd

CORE_ML_DIR = str(Path(__file__).resolve().parent.parent.parent / "core-ml")
if CORE_ML_DIR not in sys.path:
    sys.path.insert(0, CORE_ML_DIR)

import cleaning_engine


def execute_data_cleaning(
    df: pd.DataFrame,
    drop_high_null_threshold: float = 0.70,
    deduplicate: bool = True,
    auto_impute: bool = True
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans the dataset and returns transformed dataframe and detailed audit trail.
    """
    return cleaning_engine.clean_dataset(
        df=df,
        drop_high_null_threshold=drop_high_null_threshold,
        deduplicate=deduplicate,
        auto_impute=auto_impute
    )
