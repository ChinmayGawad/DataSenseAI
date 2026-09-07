"""
Clustering Engine: Segment observations using KMeans and PCA 2D projections.
Provides cluster profiles and 2D coordinates for visual cluster scatter plots.
Used by Agent 5 (Scientist) and Agent 6 (Visualization Architect).
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score


class ClusteringReport:
    def __init__(
        self,
        k: int,
        silhouette_avg: float,
        cluster_summaries: List[Dict[str, Any]],
        projection_points: List[Dict[str, Any]],
        features_used: List[str],
    ):
        self.k = k
        self.silhouette_avg = silhouette_avg
        self.cluster_summaries = cluster_summaries
        self.projection_points = projection_points
        self.features_used = features_used

    def to_dict(self) -> Dict[str, Any]:
        return {
            "k": self.k,
            "silhouette_avg": round(self.silhouette_avg, 3),
            "cluster_summaries": self.cluster_summaries,
            "projection_points": self.projection_points[:300], # Cap for frontend transfer
            "features_used": self.features_used,
        }


def run_clustering(
    df: pd.DataFrame,
    n_clusters: Optional[int] = None,
    max_k: int = 5
) -> Dict[str, Any]:
    """
    Executes automated clustering on numeric features:
    1. Selects numeric columns and scales them (StandardScaler).
    2. Determines optimal k via Silhouette scoring if k not specified.
    3. Fits KMeans.
    4. Computes 2D PCA projection for direct scatter-plot visualization.
    """
    numeric_df = df.select_dtypes(include=[np.number]).dropna()
    total_samples = len(numeric_df)

    if total_samples < 15 or numeric_df.shape[1] < 2:
        return {
            "k": 0,
            "silhouette_avg": 0.0,
            "cluster_summaries": [],
            "projection_points": [],
            "features_used": [],
            "has_sufficient_data": False,
        }

    features = list(numeric_df.columns)
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    # Determine optimal k if not provided
    best_k = n_clusters
    best_score = -1.0

    if best_k is None:
        candidate_ks = range(2, min(max_k + 1, total_samples // 3, 7))
        if not candidate_ks:
            best_k = 2
        else:
            for k in candidate_ks:
                km = KMeans(n_clusters=k, random_state=42, n_init=10)
                labels = km.fit_predict(scaled_data)
                score = silhouette_score(scaled_data, labels)
                if score > best_score:
                    best_score = score
                    best_k = k
    else:
        best_k = max(2, min(best_k, total_samples - 1))

    kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(scaled_data)
    if best_score < 0:
        best_score = silhouette_score(scaled_data, labels)

    # 2D PCA Projection for plotting
    pca = PCA(n_components=2, random_state=42)
    coords_2d = pca.fit_transform(scaled_data)

    df_clustered = numeric_df.copy()
    df_clustered["_cluster"] = labels

    cluster_summaries = []
    for c_id in range(best_k):
        c_subset = df_clustered[df_clustered["_cluster"] == c_id]
        c_size = len(c_subset)
        c_pct = round((c_size / total_samples) * 100, 1)
        
        # Mean stats for top 3 features
        means = {col: round(float(c_subset[col].mean()), 2) for col in features[:4]}

        cluster_summaries.append({
            "cluster_id": c_id,
            "size": c_size,
            "percentage": c_pct,
            "characteristic_means": means,
            "label": f"Cluster {c_id + 1} ({c_pct}%)"
        })

    projection_points = []
    for idx, (original_idx, row) in enumerate(numeric_df.iterrows()):
        projection_points.append({
            "row_index": int(original_idx),
            "pca_x": round(float(coords_2d[idx, 0]), 3),
            "pca_y": round(float(coords_2d[idx, 1]), 3),
            "cluster": int(labels[idx]),
        })

    report = ClusteringReport(
        k=best_k,
        silhouette_avg=best_score,
        cluster_summaries=cluster_summaries,
        projection_points=projection_points,
        features_used=features,
    )
    res = report.to_dict()
    res["has_sufficient_data"] = True
    return res
