"""
Harness Configuration: Runtime settings, LLM provider endpoints, and fallback parameters.
"""

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class HarnessConfig:
    api_key: Optional[str] = field(default_factory=lambda: os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY"))
    api_base: str = field(default_factory=lambda: os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"))
    model_name: str = field(default_factory=lambda: os.getenv("DEEPSEEK_MODEL", "deepseek-chat"))
    max_tokens: int = 2048
    temperature: float = 0.2
    strict_fact_check: bool = True
    enable_heuristic_fallback: bool = True
    outlier_contamination: float = 0.05
    max_clusters: int = 5
    drop_null_threshold: float = 0.70


# Global default configuration instance
default_config = HarnessConfig()
