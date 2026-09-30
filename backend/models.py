from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base

class SensorNode(Base):
    __tablename__ = "sensor_nodes"

    node_id = Column(String(32), primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    panel = Column(String(32), nullable=False, index=True)
    tilt = Column(Float, default=0.0)
    displacement = Column(Float, default=0.0)
    vibration = Column(Float, default=0.0)
    crack_width = Column(Float, default=0.0)
    battery = Column(Float, default=100.0)
    status = Column(String(32), default="ONLINE") # ONLINE, OFFLINE, MAINTENANCE
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Relationships
    readings = relationship("SensorReading", back_populates="node", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="node", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="node", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    node_id = Column(String(32), ForeignKey("sensor_nodes.node_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tilt = Column(Float, nullable=False)
    displacement = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    crack_width = Column(Float, nullable=False)
    battery = Column(Float, nullable=False)
    
    # Derived engineered features
    tilt_change = Column(Float, default=0.0)
    displacement_rate = Column(Float, default=0.0)
    vibration_change = Column(Float, default=0.0)
    crack_growth_rate = Column(Float, default=0.0)
    rolling_tilt = Column(Float, default=0.0)
    rolling_displacement = Column(Float, default=0.0)
    rolling_vibration = Column(Float, default=0.0)
    rolling_crack = Column(Float, default=0.0)

    node = relationship("SensorNode", back_populates="readings")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    node_id = Column(String(32), ForeignKey("sensor_nodes.node_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    anomaly_detected = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0) # 0.0 - 1.0 (normalized)
    predicted_risk = Column(String(32), default="LOW") # LOW, MODERATE, HIGH, CRITICAL
    risk_probability = Column(Float, default=0.0) # 0.0 - 1.0
    trend = Column(String(32), default="STABLE") # STABLE, INCREASING, RAPIDLY INCREASING
    final_risk = Column(String(32), default="LOW") # Fused final risk determination

    node = relationship("SensorNode", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_code = Column(String(64), unique=True, index=True)
    node_id = Column(String(32), ForeignKey("sensor_nodes.node_id"), nullable=False, index=True)
    panel = Column(String(32), nullable=False, index=True)
    severity = Column(String(32), nullable=False) # HIGH, CRITICAL
    message = Column(String(255), nullable=False)
    risk_probability = Column(Float, default=0.0)
    trend = Column(String(32), default="STABLE")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(32), default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED

    node = relationship("SensorNode", back_populates="alerts")
