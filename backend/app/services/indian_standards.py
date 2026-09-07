"""
DataSense AI - Indian Standards & Currency Formatting Utilities (Python)
Provides helpers for INR (₹) representation, Indian comma digit grouping (2,2,3),
and standard Indian datetime formatting.
"""

from typing import Union
from datetime import datetime


def format_indian_number(val: Union[int, float]) -> str:
    """
    Formats a number using the Indian digit grouping system (e.g., 12,84,300).
    Last 3 digits grouped, then groups of 2.
    """
    try:
        val = float(val)
    except (ValueError, TypeError):
        return str(val)

    is_negative = val < 0
    val = abs(val)

    # Check if integer or float
    if val.is_integer():
        int_str = str(int(val))
        dec_part = ""
    else:
        parts = f"{val:.2f}".split(".")
        int_str = parts[0]
        dec_part = "." + parts[1]

    if len(int_str) <= 3:
        formatted = int_str
    else:
        last3 = int_str[-3:]
        remaining = int_str[:-3]
        groups = []
        while len(remaining) > 2:
            groups.append(remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.append(remaining)
        groups.reverse()
        formatted = ",".join(groups) + "," + last3

    sign = "-" if is_negative else ""
    return f"{sign}{formatted}{dec_part}"


def format_inr(val: Union[int, float], compact: bool = False) -> str:
    """
    Formats a number as Indian Rupees:
    e.g., 128430 -> "₹1,28,430"
    e.g., 1420000 (compact) -> "₹14.20 L"
    e.g., 12500000 (compact) -> "₹1.25 Cr"
    """
    try:
        num = float(val)
    except (ValueError, TypeError):
        return f"₹{val}"

    if compact:
        abs_num = abs(num)
        sign = "-" if num < 0 else ""
        if abs_num >= 1e7:
            return f"{sign}₹{abs_num / 1e7:.2f} Cr"
        elif abs_num >= 1e5:
            return f"{sign}₹{abs_num / 1e5:.2f} L"
        elif abs_num >= 1e3:
            return f"{sign}₹{abs_num / 1e3:.1f} K"

    formatted_num = format_indian_number(num)
    return f"₹{formatted_num}"


def format_indian_date(dt_input: Union[str, datetime]) -> str:
    """
    Formats a date into Indian standard DD/MM/YYYY.
    """
    if isinstance(dt_input, datetime):
        return dt_input.strftime("%d/%m/%Y")
    try:
        # Try ISO format
        dt = datetime.fromisoformat(str(dt_input).replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return str(dt_input)
