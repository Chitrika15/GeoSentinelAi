import os
import json
from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

from config import MODELS_DIR, FEATURE_COLUMNS, RISK_CLASSES

def generate_synthetic_dataset(num_records: int = 12500, random_state: int = 42) -> pd.DataFrame:
    """
    Generate a physically realistic synthetic dataset for underground coal mine
    subsidence monitoring, deformation kinematics, and risk stratification.
    """
    np.random.seed(random_state)
    print(f"Generating {num_records} synthetic geological sensor telemetry records...")

    node_ids = [f"N{i:02d}" for i in range(1, 29)] # N01 to N28
    panels = ["Panel A", "Panel B", "Panel C", "Panel D"]
    
    # Assign panels & approximate base locations
    panel_map = {}
    lat_map = {}
    lon_map = {}
    for i, nid in enumerate(node_ids):
        p = panels[i % len(panels)]
        panel_map[nid] = p
        # Distribute spatially across mining blocks
        base_lat = 23.745 + (i // 7) * 0.005 + (i % 7) * 0.0008
        base_lon = 86.410 + (i % 7) * 0.004 + (i // 7) * 0.001
        lat_map[nid] = round(base_lat, 6)
        lon_map[nid] = round(base_lon, 6)

    records = []
    base_time = datetime(2026, 3, 1, 0, 0, 0)
    
    # Proportions: ~65% LOW (normal strata), ~18% MODERATE (settlement), ~12% HIGH (shearing), ~5% CRITICAL (active void collapse)
    proportions = [0.65, 0.18, 0.12, 0.05]
    counts = [int(p * num_records) for p in proportions]
    counts[0] += num_records - sum(counts) # Balance remainder

    risk_categories = ["LOW", "MODERATE", "HIGH", "CRITICAL"]

    for category, count in zip(risk_categories, counts):
        for _ in range(count):
            nid = np.random.choice(node_ids)
            delta_mins = np.random.randint(0, 43200) # Past 30 days
            t_stamp = base_time + timedelta(minutes=delta_mins, seconds=np.random.randint(0, 60))

            if category == "LOW":
                # Baseline stable strata: micro-seismic noise, thermal drift
                tilt = np.random.uniform(0.05, 1.4)
                displacement = np.random.uniform(0.1, 7.5)
                vibration = np.random.uniform(0.02, 0.75)
                crack_width = np.random.uniform(0.0, 1.2)

                tilt_change = np.random.normal(0.0, 0.04)
                displacement_rate = np.random.normal(0.01, 0.05)
                vibration_change = np.random.normal(0.0, 0.03)
                crack_growth_rate = np.random.normal(0.0, 0.01)

            elif category == "MODERATE":
                # Early overburden sagging, roof flexure
                tilt = np.random.uniform(1.5, 3.8)
                displacement = np.random.uniform(8.0, 24.5)
                vibration = np.random.uniform(0.8, 2.4)
                crack_width = np.random.uniform(1.3, 5.5)

                tilt_change = np.random.uniform(0.05, 0.25)
                displacement_rate = np.random.uniform(0.1, 0.7)
                vibration_change = np.random.uniform(0.05, 0.4)
                crack_growth_rate = np.random.uniform(0.02, 0.2)

            elif category == "HIGH":
                # Subsurface shear failure, developing caving arch
                tilt = np.random.uniform(4.0, 7.8)
                displacement = np.random.uniform(25.0, 58.0)
                vibration = np.random.uniform(2.5, 5.8)
                crack_width = np.random.uniform(5.8, 14.5)

                tilt_change = np.random.uniform(0.25, 0.8)
                displacement_rate = np.random.uniform(0.8, 2.5)
                vibration_change = np.random.uniform(0.4, 1.2)
                crack_growth_rate = np.random.uniform(0.2, 0.8)

            else: # CRITICAL
                # Violent roof collapse, major surface fissure emergence
                tilt = np.random.uniform(8.0, 18.0)
                displacement = np.random.uniform(60.0, 140.0)
                vibration = np.random.uniform(6.0, 15.0)
                crack_width = np.random.uniform(15.0, 48.0)

                tilt_change = np.random.uniform(0.8, 3.5)
                displacement_rate = np.random.uniform(2.5, 9.0)
                vibration_change = np.random.uniform(1.2, 5.0)
                crack_growth_rate = np.random.uniform(0.8, 4.0)

            # Ensure positive bounds
            tilt = max(0.0, round(float(tilt), 3))
            displacement = max(0.0, round(float(displacement), 3))
            vibration = max(0.0, round(float(vibration), 3))
            crack_width = max(0.0, round(float(crack_width), 3))
            tilt_change = round(float(tilt_change), 4)
            displacement_rate = max(-0.2, round(float(displacement_rate), 4))
            vibration_change = round(float(vibration_change), 4)
            crack_growth_rate = max(0.0, round(float(crack_growth_rate), 4))

            records.append({
                "timestamp": t_stamp.isoformat(),
                "node_id": nid,
                "latitude": lat_map[nid],
                "longitude": lon_map[nid],
                "panel": panel_map[nid],
                "tilt": tilt,
                "displacement": displacement,
                "vibration": vibration,
                "crack_width": crack_width,
                "tilt_change": tilt_change,
                "displacement_rate": displacement_rate,
                "vibration_change": vibration_change,
                "crack_growth_rate": crack_growth_rate,
                "risk_level": category
            })

    df = pd.DataFrame(records)
    # Shuffle
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df

def train_and_evaluate():
    # 1. Generate & Save Dataset
    df = generate_synthetic_dataset(num_records=12000)
    csv_path = MODELS_DIR / "synthetic_dataset.csv"
    df.to_csv(csv_path, index=False)
    print(f"Saved synthetic dataset to: {csv_path} (Shape: {df.shape})")

    # 2. Features and Target
    X = df[FEATURE_COLUMNS].copy()
    y = df["risk_level"].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 3. Train Isolation Forest for Unsupervised Anomaly Detection
    print("Training Isolation Forest Anomaly Detection Model...")
    # Expected anomaly proportion is roughly High + Critical (~17%)
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.17,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train)

    anomaly_model_path = MODELS_DIR / "anomaly_model.joblib"
    joblib.dump(iso_forest, anomaly_model_path)
    print(f"Saved Isolation Forest to: {anomaly_model_path}")

    # 4. Train Random Forest Classifier for Supervised Multi-Class Risk Stratification
    print("Training Random Forest Risk Classification Model...")
    rf_classifier = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf_classifier.fit(X_train, y_train)

    risk_model_path = MODELS_DIR / "risk_model.joblib"
    joblib.dump(rf_classifier, risk_model_path)
    print(f"Saved Random Forest to: {risk_model_path}")

    # 5. Evaluate Random Forest
    y_pred = rf_classifier.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    recall = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    cm = confusion_matrix(y_test, y_pred, labels=RISK_CLASSES).tolist()

    # Feature Importance
    feature_importances = {
        col: round(float(imp), 4)
        for col, imp in zip(FEATURE_COLUMNS, rf_classifier.feature_importances_)
    }
    # Sort descending
    sorted_fi = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    metrics = {
        "model_name": "Random Forest Risk Stratifier + Isolation Forest Ensemble",
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "classes": RISK_CLASSES,
        "feature_importance": sorted_fi,
        "isolation_forest_params": {
            "n_estimators": 150,
            "contamination": 0.17,
            "algorithm": "IsolationForest"
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_records_count": len(df)
    }

    metrics_path = MODELS_DIR / "metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved ML metrics to: {metrics_path}")
    print(f"Model Performance: Accuracy={accuracy:.4f}, F1={f1:.4f}, Precision={precision:.4f}, Recall={recall:.4f}")

if __name__ == "__main__":
    train_and_evaluate()
