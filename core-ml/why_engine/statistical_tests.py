"""
Statistical Validation Engine:
Executes variable-type-aware statistical tests, calculates effect sizes (Cohen's d, percentage points),
and enforces strict correlation vs causation guardrails and labeling.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from scipy import stats


class StatisticalValidationResult:
    def __init__(
        self,
        test_name: str,
        test_statistic: float,
        p_value: float,
        is_statistically_significant: bool,
        significance_threshold: float,
        effect_size_metric: str,
        effect_size_value: float,
        effect_size_interpretation: str,
        degrees_of_freedom: Optional[int] = None,
        causal_classification: str = "ASSOCIATED",
        causal_disclaimer: str = "Observational correlation confirmed; does not prove isolated causation.",
        assumptions_met: bool = True,
        notes: str = ""
    ):
        self.test_name = test_name
        self.test_statistic = test_statistic
        self.p_value = p_value
        self.is_statistically_significant = is_statistically_significant
        self.significance_threshold = significance_threshold
        self.effect_size_metric = effect_size_metric
        self.effect_size_value = effect_size_value
        self.effect_size_interpretation = effect_size_interpretation
        self.degrees_of_freedom = degrees_of_freedom
        self.causal_classification = causal_classification
        self.causal_disclaimer = causal_disclaimer
        self.assumptions_met = assumptions_met
        self.notes = notes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_name": self.test_name,
            "test_statistic": round(self.test_statistic, 4) if not np.isnan(self.test_statistic) else 0.0,
            "p_value": round(self.p_value, 5) if not np.isnan(self.p_value) else 1.0,
            "is_statistically_significant": self.is_statistically_significant,
            "significance_threshold": self.significance_threshold,
            "effect_size_metric": self.effect_size_metric,
            "effect_size_value": round(self.effect_size_value, 4) if not np.isnan(self.effect_size_value) else 0.0,
            "effect_size_interpretation": self.effect_size_interpretation,
            "degrees_of_freedom": self.degrees_of_freedom,
            "causal_classification": self.causal_classification,
            "causal_disclaimer": self.causal_disclaimer,
            "assumptions_met": self.assumptions_met,
            "notes": self.notes,
        }


def calculate_cohens_d(group1: pd.Series, group2: pd.Series) -> float:
    """
    Computes Cohen's d effect size for two independent distributions.
    """
    n1, n2 = len(group1), len(group2)
    if n1 < 2 or n2 < 2:
        return 0.0

    var1 = group1.var(ddof=1)
    var2 = group2.var(ddof=1)
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    if pooled_std == 0 or np.isnan(pooled_std):
        return 0.0

    return float((group1.mean() - group2.mean()) / pooled_std)


def interpret_cohens_d(d_val: float) -> str:
    abs_d = abs(d_val)
    if abs_d >= 0.8:
        return "Large effect size"
    elif abs_d >= 0.5:
        return "Medium effect size"
    elif abs_d >= 0.2:
        return "Small effect size"
    return "Negligible effect size"


def validate_before_vs_after(
    before_series: pd.Series,
    after_series: pd.Series,
    alpha: float = 0.05
) -> StatisticalValidationResult:
    """
    Validates whether a metric change between before and after periods is statistically significant.
    Selects Student's t-test or Mann-Whitney U based on normality checks.
    """
    clean_b = before_series.dropna()
    clean_a = after_series.dropna()

    if len(clean_b) < 2 or len(clean_a) < 2:
        return StatisticalValidationResult(
            test_name="Insufficient Observations",
            test_statistic=0.0,
            p_value=1.0,
            is_statistically_significant=False,
            significance_threshold=alpha,
            effect_size_metric="Cohen's d",
            effect_size_value=0.0,
            effect_size_interpretation="Insufficient data",
            causal_classification="INSUFFICIENT_EVIDENCE",
            assumptions_met=False,
            notes="Requires at least 2 observations in each period."
        )

    # 1. Normality check
    is_normal = True
    if len(clean_b) >= 8 and len(clean_a) >= 8:
        try:
            _, p_b = stats.shapiro(clean_b[:100])
            _, p_a = stats.shapiro(clean_a[:100])
            if p_b < 0.01 or p_a < 0.01:
                is_normal = False
        except Exception:
            is_normal = False

    cohen_d = calculate_cohens_d(clean_a, clean_b)
    effect_interp = interpret_cohens_d(cohen_d)

    if is_normal:
        stat, p_val = stats.ttest_ind(clean_a, clean_b, equal_var=False)
        test_name = "Welch's Two-Sample t-test"
    else:
        stat, p_val = stats.mannwhitneyu(clean_a, clean_b, alternative="two-sided")
        test_name = "Mann-Whitney U Non-Parametric Test"

    stat = float(stat) if not np.isnan(stat) else 0.0
    p_val = float(p_val) if not np.isnan(p_val) else 1.0
    is_sig = bool(p_val < alpha)

    # Classification
    if is_sig and abs(cohen_d) >= 0.5:
        classification = "PRIMARY_DRIVER"
    elif is_sig:
        classification = "ASSOCIATED"
    else:
        classification = "POSSIBLE_EXPLANATION"

    return StatisticalValidationResult(
        test_name=test_name,
        test_statistic=stat,
        p_value=p_val,
        is_statistically_significant=is_sig,
        significance_threshold=alpha,
        effect_size_metric="Cohen's d",
        effect_size_value=cohen_d,
        effect_size_interpretation=effect_interp,
        degrees_of_freedom=len(clean_b) + len(clean_a) - 2,
        causal_classification=classification,
        assumptions_met=True,
        notes=f"Effect size: d = {round(cohen_d, 2)} ({effect_interp}), p = {round(p_val, 5)}"
    )


def validate_categorical_vs_numeric(
    df: pd.DataFrame,
    categorical_col: str,
    numeric_col: str,
    alpha: float = 0.05
) -> StatisticalValidationResult:
    """
    Tests if numeric metric differs significantly across categorical dimension segments (ANOVA / Kruskal-Wallis).
    """
    clean_df = df[[categorical_col, numeric_col]].dropna()
    groups = [group[numeric_col].values for _, group in clean_df.groupby(categorical_col) if len(group) >= 2]

    if len(groups) < 2:
        return StatisticalValidationResult(
            test_name="Insufficient Groups",
            test_statistic=0.0,
            p_value=1.0,
            is_statistically_significant=False,
            significance_threshold=alpha,
            effect_size_metric="Eta-squared",
            effect_size_value=0.0,
            effect_size_interpretation="Insufficient data",
            causal_classification="INSUFFICIENT_EVIDENCE",
            assumptions_met=False
        )

    try:
        stat, p_val = stats.f_oneway(*groups)
        test_name = "One-Way ANOVA"
    except Exception:
        stat, p_val = stats.kruskal(*groups)
        test_name = "Kruskal-Wallis H-Test"

    stat = float(stat) if not np.isnan(stat) else 0.0
    p_val = float(p_val) if not np.isnan(p_val) else 1.0
    is_sig = bool(p_val < alpha)

    # Approximate Eta-squared effect size
    total_var = clean_df[numeric_col].var() * (len(clean_df) - 1)
    if total_var > 0:
        ss_between = sum(len(g) * (np.mean(g) - clean_df[numeric_col].mean()) ** 2 for g in groups)
        eta_sq = min(1.0, max(0.0, ss_between / total_var))
    else:
        eta_sq = 0.0

    interp = "Large variance explained" if eta_sq >= 0.14 else ("Medium variance" if eta_sq >= 0.06 else "Small variance")

    return StatisticalValidationResult(
        test_name=test_name,
        test_statistic=stat,
        p_value=p_val,
        is_statistically_significant=is_sig,
        significance_threshold=alpha,
        effect_size_metric="Eta-squared (η²)",
        effect_size_value=eta_sq,
        effect_size_interpretation=interp,
        degrees_of_freedom=len(groups) - 1,
        causal_classification="PRIMARY_DRIVER" if is_sig and eta_sq >= 0.10 else "ASSOCIATED",
        assumptions_met=True,
        notes=f"Dimension '{categorical_col}' explains {round(eta_sq * 100, 1)}% of variance in '{numeric_col}'."
    )


def validate_categorical_vs_categorical(
    df: pd.DataFrame,
    cat_col1: str,
    cat_col2: str,
    alpha: float = 0.05
) -> StatisticalValidationResult:
    """
    Tests relationship between two categorical variables (e.g. Payment Method vs Cancellation Status).
    Uses Chi-Square Test of Independence and Cramér's V effect size.
    """
    clean_df = df[[cat_col1, cat_col2]].dropna()
    if len(clean_df) < 5:
        return StatisticalValidationResult(
            test_name="Chi-Square Test",
            test_statistic=0.0,
            p_value=1.0,
            is_statistically_significant=False,
            significance_threshold=alpha,
            effect_size_metric="Cramér's V",
            effect_size_value=0.0,
            effect_size_interpretation="Insufficient data",
            causal_classification="INSUFFICIENT_EVIDENCE",
            assumptions_met=False
        )

    contingency_table = pd.crosstab(clean_df[cat_col1], clean_df[cat_col2])
    if contingency_table.shape[0] < 2 or contingency_table.shape[1] < 2:
        return StatisticalValidationResult(
            test_name="Chi-Square Test",
            test_statistic=0.0,
            p_value=1.0,
            is_statistically_significant=False,
            significance_threshold=alpha,
            effect_size_metric="Cramér's V",
            effect_size_value=0.0,
            effect_size_interpretation="Single category",
            causal_classification="INSUFFICIENT_EVIDENCE",
            assumptions_met=False
        )

    chi2, p_val, dof, _ = stats.chi2_contingency(contingency_table)
    n = contingency_table.sum().sum()
    min_dim = min(contingency_table.shape) - 1
    cramers_v = np.sqrt(chi2 / max(n * min_dim, 1e-6)) if min_dim > 0 else 0.0

    cramers_v = float(min(1.0, max(0.0, cramers_v)))
    is_sig = bool(p_val < alpha)

    interp = "Strong association" if cramers_v >= 0.3 else ("Moderate association" if cramers_v >= 0.15 else "Weak association")

    return StatisticalValidationResult(
        test_name="Chi-Square Contingency Test of Independence",
        test_statistic=float(chi2),
        p_value=float(p_val),
        is_statistically_significant=is_sig,
        significance_threshold=alpha,
        effect_size_metric="Cramér's V",
        effect_size_value=cramers_v,
        effect_size_interpretation=interp,
        degrees_of_freedom=int(dof),
        causal_classification="SUPPORTING_FACTOR" if is_sig and cramers_v >= 0.2 else "ASSOCIATED",
        assumptions_met=True,
        notes=f"Significant categorical association: Cramér's V = {round(cramers_v, 2)}, p = {round(p_val, 5)}"
    )
