import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{BASE_DIR / 'geosentinel.db'}"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

SIMULATION_INTERVAL_SECONDS = 2.5
TOTAL_NODES_COUNT = 28

# Base geographical anchor: Jharia Coalfield mining block
BASE_LATITUDE = 23.7500
BASE_LONGITUDE = 86.4150

PANELS = ["Panel A", "Panel B", "Panel C", "Panel D"]

FEATURE_COLUMNS = [
    "tilt",
    "displacement",
    "vibration",
    "crack_width",
    "tilt_change",
    "displacement_rate",
    "vibration_change",
    "crack_growth_rate"
]

RISK_CLASSES = ["LOW", "MODERATE", "HIGH", "CRITICAL"]
