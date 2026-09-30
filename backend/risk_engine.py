import math
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in meters between two coordinates."""
    R = 6371000.0 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class RiskEngine:
    def __init__(self):
        # Numeric weight mapping for risk levels
        self.risk_severity_weights = {
            "LOW": 1.0,
            "MODERATE": 2.5,
            "HIGH": 4.5,
            "CRITICAL": 7.0
        }

    def compute_temporal_trend(
        self,
        features: Dict[str, float],
        previous_readings: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Determines deformation kinematics trend:
        STABLE, INCREASING, or RAPIDLY INCREASING
        based on displacement velocity and crack growth acceleration.
        """
        disp_rate = abs(features.get("displacement_rate", 0.0))
        crack_rate = abs(features.get("crack_growth_rate", 0.0))
        tilt_change = abs(features.get("tilt_change", 0.0))

        # Check multi-reading slope if available
        if previous_readings and len(previous_readings) >= 3:
            recent_disps = [float(r.get("displacement", 0.0)) for r in previous_readings[-4:]] + [features["displacement"]]
            diffs = np.diff(recent_disps)
            avg_slope = float(np.mean(diffs))
        else:
            avg_slope = disp_rate

        if avg_slope > 1.8 or disp_rate > 2.0 or crack_rate > 0.8 or tilt_change > 1.0:
            return "RAPIDLY INCREASING"
        elif avg_slope > 0.3 or disp_rate > 0.35 or crack_rate > 0.15 or tilt_change > 0.2:
            return "INCREASING"
        else:
            return "STABLE"

    def evaluate_fused_risk(
        self,
        features: Dict[str, float],
        ml_prediction: Dict[str, Any],
        trend: str,
        nearby_abnormal_count: int = 0
    ) -> Tuple[str, float]:
        """
        Synthesizes AI predictions, anomaly detection, kinematic trends,
        and spatial clustering to produce a robust final risk level and risk score (0-100).
        """
        rf_predicted = ml_prediction.get("predicted_risk", "LOW")
        rf_proba = ml_prediction.get("risk_probability", 0.5)
        anomaly_detected = ml_prediction.get("anomaly_detected", False)
        anomaly_score = ml_prediction.get("anomaly_score", 0.0)

        # Baseline score from Random Forest prediction
        base_scores = {
            "LOW": 15.0,
            "MODERATE": 45.0,
            "HIGH": 75.0,
            "CRITICAL": 92.0
        }
        score = base_scores.get(rf_predicted, 20.0)

        # Modulate by model certainty
        if rf_predicted in ["HIGH", "CRITICAL"]:
            score += (rf_proba - 0.5) * 15.0
        else:
            score += (1.0 - rf_proba) * 10.0

        # Anomaly detection contribution (Isolation Forest)
        if anomaly_detected or anomaly_score > 0.65:
            score += anomaly_score * 12.0

        # Kinematic temporal trend contribution
        if trend == "RAPIDLY INCREASING":
            score += 15.0
        elif trend == "INCREASING":
            score += 7.0

        # Spatial neighbor effect (cluster of nearby abnormal sensors)
        if nearby_abnormal_count >= 3:
            score += 12.0
        elif nearby_abnormal_count >= 1:
            score += 5.0

        # Clamp score to [0.0, 100.0]
        final_score = float(np.clip(score, 0.0, 100.0))

        # Stratify final risk level
        if final_score >= 82.0:
            final_risk = "CRITICAL"
        elif final_score >= 60.0:
            final_risk = "HIGH"
        elif final_score >= 35.0:
            final_risk = "MODERATE"
        else:
            final_risk = "LOW"

        return final_risk, round(final_score, 2)

    def identify_spatial_risk_zones(
        self,
        nodes: List[Dict[str, Any]],
        proximity_threshold_meters: float = 650.0
    ) -> List[Dict[str, Any]]:
        """
        Performs spatial neighbor analysis across distributed sensor nodes.
        Clusters nearby abnormal / high-risk nodes into georeferenced Risk Zones.
        """
        abnormal_nodes = [
            n for n in nodes
            if n.get("current_risk") in ["MODERATE", "HIGH", "CRITICAL"]
            or n.get("anomaly_detected") is True
        ]

        if not abnormal_nodes:
            return []

        clusters: List[List[Dict[str, Any]]] = []
        visited = set()

        for i, node_a in enumerate(abnormal_nodes):
            nid_a = node_a["node_id"]
            if nid_a in visited:
                continue

            cluster = [node_a]
            visited.add(nid_a)

            for j, node_b in enumerate(abnormal_nodes):
                nid_b = node_b["node_id"]
                if nid_b in visited:
                    continue

                dist = haversine_distance_meters(
                    node_a["latitude"], node_a["longitude"],
                    node_b["latitude"], node_b["longitude"]
                )

                if dist <= proximity_threshold_meters:
                    cluster.append(node_b)
                    visited.add(nid_b)

            if len(cluster) >= 2: # At least 2 neighboring abnormal nodes form a risk zone
                clusters.append(cluster)

        risk_zones = []
        for idx, cluster in enumerate(clusters, start=1):
            lats = [n["latitude"] for n in cluster]
            lons = [n["longitude"] for n in cluster]
            center_lat = round(float(np.mean(lats)), 6)
            center_lon = round(float(np.mean(lons)), 6)

            has_critical = any(n.get("current_risk") == "CRITICAL" for n in cluster)
            has_high = any(n.get("current_risk") == "HIGH" for n in cluster)

            if has_critical:
                severity = "CRITICAL"
                zone_score = 90.0 + len(cluster) * 2.0
            elif has_high:
                severity = "HIGH"
                zone_score = 70.0 + len(cluster) * 2.5
            else:
                severity = "MODERATE"
                zone_score = 45.0 + len(cluster) * 2.0

            zone_score = min(100.0, zone_score)
            panel_tags = list({n.get("panel", "Unknown") for n in cluster})
            panel_prefix = panel_tags[0].replace(" ", "-").upper() if panel_tags else "PANEL"

            risk_zones.append({
                "zone_id": f"RZ-{panel_prefix}-{idx:02d}",
                "center_latitude": center_lat,
                "center_longitude": center_lon,
                "affected_nodes": [n["node_id"] for n in cluster],
                "severity": severity,
                "risk_score": round(zone_score, 1),
                "timestamp": datetime.utcnow().isoformat(),
                "disclaimer": "AI-generated prototype risk zones. Not official engineering safety boundaries."
            })

        return risk_zones

risk_engine = RiskEngine()
