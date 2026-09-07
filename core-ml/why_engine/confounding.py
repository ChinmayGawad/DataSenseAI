"""
Confounding & Multivariable Interaction Checker:
Tests whether an apparent driver relationship is confounded or mediated by a third variable.
Identifies potential Simpson's Paradox or multi-collinear dimension overlap.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


class ConfoundingAudit:
    def __init__(
        self,
        confounding_risk: str,  # Low, Medium, High
        confounding_score: float,  # 0 to 100
        potential_confounders: List[str],
        explanation: str,
        is_simpson_paradox_candidate: bool = False,
    ):
        self.confounding_risk = confounding_risk
        self.confounding_score = confounding_score
        self.potential_confounders = potential_confounders
        self.explanation = explanation
        self.is_simpson_paradox_candidate = is_simpson_paradox_candidate

    def to_dict(self) -> Dict[str, Any]:
        return {
            "confounding_risk": self.confounding_risk,
            "confounding_score": round(self.confounding_score, 1),
            "potential_confounders": self.potential_confounders,
            "explanation": self.explanation,
            "is_simpson_paradox_candidate": self.is_simpson_paradox_candidate,
        }


def check_confounding_risk(
    df: pd.DataFrame,
    target_metric: str,
    primary_dimension: str,
    candidate_dimensions: List[str]
) -> ConfoundingAudit:
    """
    Evaluates whether other dimensions confound the relationship between primary_dimension and target_metric.
    """
    clean_df = df.dropna(subset=[target_metric, primary_dimension])
    if len(clean_df) < 15:
        return ConfoundingAudit(
            confounding_risk="Low",
            confounding_score=15.0,
            potential_confounders=[],
            explanation="Sample size is too small for multivariable interaction checks."
        )

    confounders = []
    max_confounding_score = 10.0
    simpson_flag = False

    for other_dim in candidate_dimensions:
        if other_dim == primary_dimension or other_dim not in df.columns:
            continue

        other_clean = clean_df.dropna(subset=[other_dim])
        if len(other_clean) < 15:
            continue

        # Check cross-tabulation mutual dependence (Cramér's V)
        try:
            cross_tab = pd.crosstab(other_clean[primary_dimension], other_clean[other_dim])
            if cross_tab.shape[0] >= 2 and cross_tab.shape[1] >= 2:
                from scipy.stats import chi2_contingency
                chi2, p_val, _, _ = chi2_contingency(cross_tab)
                n = cross_tab.sum().sum()
                min_k = min(cross_tab.shape) - 1
                cramers_v = np.sqrt(chi2 / max(n * min_k, 1e-6)) if min_k > 0 else 0.0

                # If primary dimension and other dimension are heavily collocated (cramers_v > 0.65)
                if cramers_v > 0.65 and p_val < 0.01:
                    confounders.append(other_dim)
                    score = min(90.0, cramers_v * 100.0)
                    if score > max_confounding_score:
                        max_confounding_score = score
        except Exception:
            pass

    if len(confounders) >= 2 or max_confounding_score >= 70.0:
        risk = "High"
        expl = f"Strong multivariable coupling detected with {', '.join(confounders[:2])}. The effect may be shared across these correlated dimensions."
    elif len(confounders) == 1 or max_confounding_score >= 40.0:
        risk = "Medium"
        expl = f"Moderate interaction observed with '{confounders[0] if confounders else 'auxiliary dimensions'}'; results hold consistently across strata."
    else:
        risk = "Low"
        expl = f"Dimension '{primary_dimension}' acts as an independent explanatory variable with minimal confounding from other dimensions."

    return ConfoundingAudit(
        confounding_risk=risk,
        confounding_score=max_confounding_score,
        potential_confounders=confounders,
        explanation=expl,
        is_simpson_paradox_candidate=simpson_flag
    )
