from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Sensor Node schemas
class SensorNodeBase(BaseModel):
    node_id: str
    latitude: float
    longitude: float
    panel: str
    tilt: float
    displacement: float
    vibration: float
    crack_width: float
    battery: float
    status: str

class SensorNodeResponse(SensorNodeBase):
    last_updated: datetime
    current_risk: Optional[str] = "LOW"
    anomaly_detected: Optional[bool] = False
    anomaly_score: Optional[float] = 0.0
    risk_probability: Optional[float] = 0.0
    trend: Optional[str] = "STABLE"

    class Config:
        from_attributes = True

# Sensor Reading schemas
class SensorReadingBase(BaseModel):
    node_id: str
    tilt: float
    displacement: float
    vibration: float
    crack_width: float
    battery: float

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: int
    timestamp: datetime
    tilt_change: float = 0.0
    displacement_rate: float = 0.0
    vibration_change: float = 0.0
    crack_growth_rate: float = 0.0
    rolling_tilt: float = 0.0
    rolling_displacement: float = 0.0
    rolling_vibration: float = 0.0
    rolling_crack: float = 0.0

    class Config:
        from_attributes = True

# Prediction schemas
class PredictionResponse(BaseModel):
    id: int
    node_id: str
    timestamp: datetime
    anomaly_detected: bool
    anomaly_score: float
    predicted_risk: str
    risk_probability: float
    trend: str
    final_risk: str

    class Config:
        from_attributes = True

# Alert schemas
class AlertResponse(BaseModel):
    id: int
    alert_code: str
    node_id: str
    panel: str
    severity: str
    message: str
    risk_probability: float
    trend: str
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True

# Node Detail with historical context
class SensorNodeDetail(SensorNodeResponse):
    recent_readings: List[SensorReadingResponse] = []
    latest_prediction: Optional[PredictionResponse] = None
    active_alerts: List[AlertResponse] = []

# Spatial Risk Zone
class RiskZone(BaseModel):
    zone_id: str
    center_latitude: float
    center_longitude: float
    affected_nodes: List[str]
    severity: str # MODERATE, HIGH, CRITICAL
    risk_score: float # 0 - 100
    timestamp: datetime
    disclaimer: str = "AI-generated prototype risk zones. Not official engineering safety boundaries."

# Dashboard Summary
class DashboardStats(BaseModel):
    total_nodes: int
    online_nodes: int
    offline_nodes: int
    normal_count: int
    moderate_count: int
    high_risk_count: int
    critical_count: int
    active_alerts_count: int
    overall_risk: str
    overall_risk_score: float
    simulation_active: bool
    subsidence_active: bool
    subsidence_stage: int
    recent_alerts: List[AlertResponse] = []
    risk_zones: List[RiskZone] = []
    timestamp: datetime

# System Health
class SystemHealth(BaseModel):
    backend_status: str
    database_status: str
    ml_models_status: str
    websocket_status: str
    total_nodes: int
    online_nodes: int
    offline_nodes: int
    average_battery: float
    low_battery_count: int
    last_communication: datetime
    uptime_seconds: float
    memory_usage_mb: float
    active_connections: int

# ML Metrics schema
class MLMetricsResponse(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    classes: List[str]
    feature_importance: Dict[str, float]
    isolation_forest_params: Dict[str, Any]
    trained_at: str
    dataset_records_count: int

# Simulation Action Response
class SimulationResponse(BaseModel):
    status: str
    message: str
    simulation_active: bool
    subsidence_active: bool
    stage: Optional[int] = 0
