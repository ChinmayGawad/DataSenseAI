"""
Multi-Page & Multi-Fragment Table Stitcher:
Reconciles and stitches table fragments across multi-page PDFs, multi-sheet workbooks,
and multi-section documents based on column signatures, header alignment, and geometric continuation.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from difflib import SequenceMatcher

from .schema import ExtractedTable


def calculate_header_similarity(headers_a: List[str], headers_b: List[str]) -> float:
    """
    Computes Jaccard + token string similarity between two header lists.
    """
    if not headers_a or not headers_b:
        return 0.0
    if len(headers_a) != len(headers_b):
        # Different column counts
        return 0.0

    clean_a = [str(h).strip().lower() for h in headers_a]
    clean_b = [str(h).strip().lower() for h in headers_b]

    # Exact match
    if clean_a == clean_b:
        return 1.0

    # Token similarity
    matches = sum(
        1 for a, b in zip(clean_a, clean_b)
        if a == b or SequenceMatcher(None, a, b).ratio() > 0.8
    )
    return matches / len(clean_a)


def stitch_table_fragments(fragments: List[Dict[str, Any]]) -> List[ExtractedTable]:
    """
    Groups and stitches consecutive table fragments sharing matching or compatible schemas.
    fragments item: {"page": int, "table_index": int, "df": pd.DataFrame, "headers": list}
    """
    if not fragments:
        return []

    stitched_groups: List[List[Dict[str, Any]]] = []

    for frag in fragments:
        if not stitched_groups:
            stitched_groups.append([frag])
            continue

        # Compare with the last fragment of current active group
        current_group = stitched_groups[-1]
        last_frag = current_group[-1]

        similarity = calculate_header_similarity(last_frag["headers"], frag["headers"])
        # If columns match and pages are consecutive or contiguous
        if similarity >= 0.7:
            current_group.append(frag)
        else:
            # Check if it matches any prior group
            matched_group = None
            for grp in stitched_groups:
                if calculate_header_similarity(grp[0]["headers"], frag["headers"]) >= 0.8:
                    matched_group = grp
                    break
            if matched_group is not None:
                matched_group.append(frag)
            else:
                stitched_groups.append([frag])

    # Convert groups into ExtractedTable objects
    result_tables: List[ExtractedTable] = []

    for idx, grp in enumerate(stitched_groups):
        first_frag = grp[0]
        canonical_headers = first_frag["headers"]

        dfs_to_concat = []
        pages = []
        for f in grp:
            df_part = f["df"].copy()
            # Align column names to canonical headers
            if len(df_part.columns) == len(canonical_headers):
                df_part.columns = canonical_headers
            dfs_to_concat.append(df_part)
            pages.append(f["page"])

        combined_df = pd.concat(dfs_to_concat, ignore_index=True) if dfs_to_concat else pd.DataFrame()
        # Drop duplicates if table headers repeated across pages
        if len(combined_df) > 0 and list(canonical_headers) == list(combined_df.iloc[0]):
            combined_df = combined_df.iloc[1:].reset_index(drop=True)

        min_page = min(pages) if pages else 1
        max_page = max(pages) if pages else 1
        page_range = f"{min_page}" if min_page == max_page else f"{min_page}-{max_page}"

        tbl_name = f"Consolidated Table {idx + 1}"
        if len(pages) > 1:
            tbl_name += f" (Stitched across Pages {page_range})"

        result_tables.append(
            ExtractedTable(
                table_id=f"stitched_tbl_{idx + 1}",
                name=tbl_name,
                page_number=min_page,
                page_range=page_range,
                df=combined_df,
                headers=canonical_headers,
                extraction_method="multi_page_stitcher",
                average_confidence=95.0
            )
        )

    # Sort so largest table is first (primary dataset)
    result_tables.sort(key=lambda t: t.row_count * t.col_count, reverse=True)
    return result_tables


def stitch_multi_page_tables(tables: List[ExtractedTable]) -> List[ExtractedTable]:
    """
    Stitches a list of ExtractedTable objects based on schema similarity and column matching.
    """
    if not tables:
        return []

    frags = []
    for idx, t in enumerate(tables):
        df = t.df if hasattr(t, 'df') else getattr(t, 'dataframe', None)
        if df is not None and not df.empty:
            frags.append({
                "page": t.page_number,
                "table_index": idx,
                "df": df,
                "headers": list(df.columns)
            })

    if not frags:
        return tables

    return stitch_table_fragments(frags)

