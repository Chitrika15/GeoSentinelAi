import os
import json
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
import joblib

from config import MODELS_DIR, FEATURE_COLUMNS, RISK_CLASSES

logger = logging.getLogger("geosentinel.ml")

class MLService:
    def __init__(self):
        self.anomaly_model = None
        self.risk_model = None
        self.metrics: Dict[str, Any] = {}
        self.load_models()

    def load_models(self):
        anomaly_path = MODELS_DIR / "anomaly_model.joblib"
        risk_path = MODELS_DIR / "risk_model.joblib"
        metrics_path = MODELS_DIR / "metrics.json"

        try:
            if anomaly_path.exists():
                self.anomaly_model = joblib.load(anomaly_path)
                logger.info(f"Loaded Isolation Forest from {anomaly_path}")
            else:
                logger.warning("Anomaly model file not found!")

            if risk_path.exists():
                self.risk_model = joblib.load(risk_path)
                logger.info(f"Loaded Random Forest classifier from {risk_path}")
            else:
                logger.warning("Risk model file not found!")

            if metrics_path.exists():
                with open(metrics_path, "r") as f:
                    self.metrics = json.load(f)
            else:
                logger.warning("Metrics file not found!")
        except Exception as e:
            logger.error(f"Error loading ML models: {e}", exc_info=True)

    def is_ready(self) -> bool:
        return self.anomaly_model is not None and self.risk_model is not None

    def preprocess_reading(
        self,
        current_data: Dict[str, Any],
        previous_data: Optional[Dict[str, Any]] = None,
        history_window: Optional[list] = None,
        time_delta_seconds: float = 2.5
    ) -> Dict[str, float]:
        """
        Preprocesses sensor reading: cleans values, handles missing data,
        and computes derived kinematic features & rolling statistics.
        """
        # Clean and clamp base sensor values
        try:
            tilt = float(current_data.get("tilt", 0.0) or 0.0)
            displacement = float(current_data.get("displacement", 0.0) or 0.0)
            vibration = float(current_data.get("vibration", 0.0) or 0.0)
            crack_width = float(current_data.get("crack_width", 0.0) or 0.0)
        except (ValueError, TypeError):
            tilt, displacement, vibration, crack_width = 0.0, 0.0, 0.0, 0.0

        tilt = max(0.0, tilt)
        displacement = max(0.0, displacement)
        vibration = max(0.0, vibration)
        crack_width = max(0.0, crack_width)

        # Delta calculation against previous reading
        dt = max(0.5, time_delta_seconds)
        if previous_data:
            prev_tilt = float(previous_data.get("tilt", tilt))
            prev_disp = float(previous_data.get("displacement", displacement))
            prev_vib = float(previous_data.get("vibration", vibration))
            prev_crack = float(previous_data.get("crack_width", crack_width))

            tilt_change = round(tilt - prev_tilt, 4)
            displacement_rate = round((displacement - prev_disp) / dt, 4)
            vibration_change = round(vibration - prev_vib, 4)
            crack_growth_rate = round((crack_width - prev_crack) / dt, 4)
        else:
            tilt_change = 0.0
            displacement_rate = 0.0
            vibration_change = 0.0
            crack_growth_rate = 0.0

        # Rolling averages over recent window (default up to last 5 readings)
        if history_window and len(history_window) > 0:
            window_tilts = [r.get("tilt", tilt) for r in history_window] + [tilt]
            window_disps = [r.get("displacement", displacement) for r in history_window] + [displacement]
            window_vibs = [r.get("vibration", vibration) for r in history_window] + [vibration]
            window_cracks = [r.get("crack_width", crack_width) for r in history_window] + [crack_width]

            rolling_tilt = round(float(np.mean(window_tilts[-5:])), 3)
            rolling_displacement = round(float(np.mean(window_disps[-5:])), 3)
            rolling_vibration = round(float(np.mean(window_vibs[-5:])), 3)
            rolling_crack = round(float(np.mean(window_cracks[-5:])), 3)
        else:
            rolling_tilt = tilt
            rolling_displacement = displacement
            rolling_vibration = vibration
            rolling_crack = crack_width

        return {
            "tilt": tilt,
            "displacement": displacement,
            "vibration": vibration,
            "crack_width": crack_width,
            "tilt_change": tilt_change,
            "displacement_rate": displacement_rate,
            "vibration_change": vibration_change,
            "crack_growth_rate": crack_growth_rate,
            "rolling_tilt": rolling_tilt,
            "rolling_displacement": rolling_displacement,
            "rolling_vibration": rolling_vibration,
            "rolling_crack": rolling_crack
        }

    def predict(self, feature_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs dual-model inference:
        1. Isolation Forest for unsupervised anomaly detection + anomaly score
        2. Random Forest for supervised risk classification + probability distribution
        """
        if not self.is_ready():
            self.load_models()

        # Build feature vector
        vector = [[feature_dict[col] for col in FEATURE_COLUMNS]]
        X = pd.DataFrame(vector, columns=FEATURE_COLUMNS)

        # 1. Isolation Forest Anomaly Detection
        if self.anomaly_model is not None:
            # -1 for anomaly, 1 for normal
            raw_pred = self.anomaly_model.predict(X)[0]
            anomaly_detected = bool(raw_pred == -1)

            # Decision function: lower values mean more anomalous
            score_raw = self.anomaly_model.decision_function(X)[0]
            # Normalize decision score to [0.0, 1.0] where 1.0 = extremely anomalous
            anomaly_score = float(np.clip(0.5 - (score_raw * 1.5), 0.0, 1.0))
        else:
            anomaly_detected = False
            anomaly_score = 0.0

        # 2. Random Forest Risk Stratification
        if self.risk_model is not None:
            predicted_risk = str(self.risk_model.predict(X)[0])
            probas = self.risk_model.predict_proba(X)[0]
            classes = list(self.risk_model.classes_)
            
            prob_dict = {cls: float(p) for cls, p in zip(classes, probas)}
            # Probability of the selected predicted risk class
            risk_probability = float(prob_dict.get(predicted_risk, 0.5))
        else:
            predicted_risk = "LOW"
            prob_dict = {"LOW": 1.0, "MODERATE": 0.0, "HIGH": 0.0, "CRITICAL": 0.0}
            risk_probability = 0.9

        return {
            "anomaly_detected": anomaly_detected,
            "anomaly_score": round(anomaly_score, 4),
            "predicted_risk": predicted_risk,
            "risk_probability": round(risk_probability, 4),
            "probability_distribution": prob_dict
        }

ml_service = MLService()
