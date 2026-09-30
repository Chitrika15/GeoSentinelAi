import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from config import CORS_ORIGINS, SIMULATION_INTERVAL_SECONDS
from database import engine, Base, get_db, SessionLocal
from models import SensorNode, SensorReading, Prediction, Alert
import schemas
from simulator import simulator
from ml_service import ml_service
from risk_engine import risk_engine
from websocket_manager import ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("geosentinel.main")

# Record server start time for system health
START_TIME = time.time()

# Background simulation runner
async def simulation_background_loop():
    logger.info("Simulation background loop initialized.")
    while True:
        try:
            if simulator.is_running:
                db = SessionLocal()
                try:
                    await simulator.step(db)
                except Exception as e:
                    logger.error(f"Error in simulation step: {e}", exc_info=True)
                finally:
                    db.close()
        except Exception as outer_e:
            logger.error(f"Unexpected simulation loop error: {outer_e}", exc_info=True)

        await asyncio.sleep(SIMULATION_INTERVAL_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created & 28 sensors initialized
    Base.metadata.create_all(bind=engine)
    logger.info("SQLite database tables verified.")

    db = SessionLocal()
    try:
        simulator.initialize_sensor_nodes(db)
    except Exception as e:
        logger.error(f"Failed to seed initial sensor nodes: {e}", exc_info=True)
    finally:
        db.close()

    # Automatically start simulation by default so fresh run immediately demonstrates live telemetry
    simulator.start()

    # Launch background loop task
    sim_task = asyncio.create_task(simulation_background_loop())
    yield
    # Shutdown
    simulator.stop()
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass
    logger.info("GeoSentinel AI backend shutdown complete.")

app = FastAPI(
    title="GeoSentinel AI Backend",
    description="AI-Enabled Real-Time Mine Subsidence Monitoring, Prediction & Early Warning System",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WEBSOCKET ROUTE ----------------- #
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Client can send commands or ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

# ----------------- SYSTEM & HEALTH ----------------- #
@app.get("/api/health")
def get_health():
    return {
        "status": "HEALTHY",
        "service": "GeoSentinel AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/system-health", response_model=schemas.SystemHealth)
def get_system_health(db: Session = Depends(get_db)):
    total = db.query(SensorNode).count()
    online = db.query(SensorNode).filter(SensorNode.status == "ONLINE").count()
    offline = total - online

    nodes = db.query(SensorNode).all()
    batteries = [n.battery for n in nodes]
    avg_bat = round(float(sum(batteries) / max(1, len(batteries))), 1) if batteries else 0.0
    low_bat = sum(1 for b in batteries if b < 25.0)

    last_update = db.query(SensorNode.last_updated).order_by(desc(SensorNode.last_updated)).first()
    last_comm = last_update[0] if last_update else datetime.utcnow()

    # Check ML readiness
    ml_status = "OPERATIONAL" if ml_service.is_ready() else "DEGRADED"

    return schemas.SystemHealth(
        backend_status="ONLINE",
        database_status="CONNECTED",
        ml_models_status=ml_status,
        websocket_status=f"ACTIVE ({ws_manager.connection_count} clients)",
        total_nodes=total,
        online_nodes=online,
        offline_nodes=offline,
        average_battery=avg_bat,
        low_battery_count=low_bat,
        last_communication=last_comm,
        uptime_seconds=round(time.time() - START_TIME, 1),
        memory_usage_mb=48.5,
        active_connections=ws_manager.connection_count
    )

# ----------------- DASHBOARD ----------------- #
@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    nodes = db.query(SensorNode).all()
    total = len(nodes)
    online = sum(1 for n in nodes if n.status == "ONLINE")
    offline = total - online

    # Get latest predictions for each node
    latest_preds = {}
    for n in nodes:
        pred = db.query(Prediction).filter(Prediction.node_id == n.node_id).order_by(desc(Prediction.timestamp)).first()
        latest_preds[n.node_id] = pred

    normal_count = 0
    moderate_count = 0
    high_count = 0
    critical_count = 0

    node_summaries = []
    for n in nodes:
        p = latest_preds.get(n.node_id)
        risk = p.final_risk if p else "LOW"
        if risk == "CRITICAL":
            critical_count += 1
        elif risk == "HIGH":
            high_count += 1
        elif risk == "MODERATE":
            moderate_count += 1
        else:
            normal_count += 1

        node_summaries.append({
            "node_id": n.node_id,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "panel": n.panel,
            "current_risk": risk,
            "anomaly_detected": p.anomaly_detected if p else False
        })

    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").order_by(desc(Alert.timestamp)).limit(10).all()
    active_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()

    if critical_count > 0:
        overall_risk = "CRITICAL"
        risk_score = 92.5
    elif high_count > 0:
        overall_risk = "HIGH"
        risk_score = 74.0
    elif moderate_count > 0:
        overall_risk = "MODERATE"
        risk_score = 42.0
    else:
        overall_risk = "LOW"
        risk_score = 14.5

    risk_zones = risk_engine.identify_spatial_risk_zones(node_summaries)

    return schemas.DashboardStats(
        total_nodes=total,
        online_nodes=online,
        offline_nodes=offline,
        normal_count=normal_count,
        moderate_count=moderate_count,
        high_risk_count=high_count,
        critical_count=critical_count,
        active_alerts_count=active_count,
        overall_risk=overall_risk,
        overall_risk_score=risk_score,
        simulation_active=simulator.is_running,
        subsidence_active=simulator.subsidence_active,
        subsidence_stage=simulator.subsidence_stage,
        recent_alerts=[schemas.AlertResponse.model_validate(a) for a in active_alerts],
        risk_zones=[schemas.RiskZone(**z) for z in risk_zones],
        timestamp=datetime.utcnow()
    )

# ----------------- NODES ----------------- #
@app.get("/api/nodes", response_model=List[schemas.SensorNodeResponse])
def get_nodes(
    panel: Optional[str] = None,
    risk: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SensorNode)
    if panel:
        query = query.filter(SensorNode.panel == panel)
    nodes = query.all()

    result = []
    for n in nodes:
        pred = db.query(Prediction).filter(Prediction.node_id == n.node_id).order_by(desc(Prediction.timestamp)).first()
        res = schemas.SensorNodeResponse(
            node_id=n.node_id,
            latitude=n.latitude,
            longitude=n.longitude,
            panel=n.panel,
            tilt=n.tilt,
            displacement=n.displacement,
            vibration=n.vibration,
            crack_width=n.crack_width,
            battery=n.battery,
            status=n.status,
            last_updated=n.last_updated,
            current_risk=pred.final_risk if pred else "LOW",
            anomaly_detected=pred.anomaly_detected if pred else False,
            anomaly_score=pred.anomaly_score if pred else 0.0,
            risk_probability=pred.risk_probability if pred else 0.0,
            trend=pred.trend if pred else "STABLE"
        )
        if risk and res.current_risk != risk:
            continue
        result.append(res)
    return result

@app.get("/api/nodes/{node_id}", response_model=schemas.SensorNodeDetail)
def get_node_detail(node_id: str, db: Session = Depends(get_db)):
    node = db.query(SensorNode).filter(SensorNode.node_id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Sensor node {node_id} not found.")

    pred = db.query(Prediction).filter(Prediction.node_id == node_id).order_by(desc(Prediction.timestamp)).first()
    readings = db.query(SensorReading).filter(SensorReading.node_id == node_id).order_by(desc(SensorReading.timestamp)).limit(30).all()
    readings.reverse() # chronological order for plotting

    alerts = db.query(Alert).filter(Alert.node_id == node_id, Alert.status == "ACTIVE").all()

    return schemas.SensorNodeDetail(
        node_id=node.node_id,
        latitude=node.latitude,
        longitude=node.longitude,
        panel=node.panel,
        tilt=node.tilt,
        displacement=node.displacement,
        vibration=node.vibration,
        crack_width=node.crack_width,
        battery=node.battery,
        status=node.status,
        last_updated=node.last_updated,
        current_risk=pred.final_risk if pred else "LOW",
        anomaly_detected=pred.anomaly_detected if pred else False,
        anomaly_score=pred.anomaly_score if pred else 0.0,
        risk_probability=pred.risk_probability if pred else 0.0,
        trend=pred.trend if pred else "STABLE",
        recent_readings=[schemas.SensorReadingResponse.model_validate(r) for r in readings],
        latest_prediction=schemas.PredictionResponse.model_validate(pred) if pred else None,
        active_alerts=[schemas.AlertResponse.model_validate(a) for a in alerts]
    )

# ----------------- READINGS & HISTORY ----------------- #
@app.get("/api/readings", response_model=List[schemas.SensorReadingResponse])
def get_readings(
    node_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if node_id:
        query = query.filter(SensorReading.node_id == node_id)
    readings = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()
    readings.reverse()
    return [schemas.SensorReadingResponse.model_validate(r) for r in readings]

@app.get("/api/readings/{node_id}", response_model=List[schemas.SensorReadingResponse])
def get_node_readings(
    node_id: str,
    limit: int = Query(40, ge=1, le=200),
    db: Session = Depends(get_db)
):
    readings = db.query(SensorReading).filter(
        SensorReading.node_id == node_id
    ).order_by(desc(SensorReading.timestamp)).limit(limit).all()
    readings.reverse()
    return [schemas.SensorReadingResponse.model_validate(r) for r in readings]

@app.get("/api/history")
def get_history(
    node_id: Optional[str] = None,
    panel: Optional[str] = None,
    risk: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading, Prediction, SensorNode).join(
        SensorNode, SensorReading.node_id == SensorNode.node_id
    ).outerjoin(
        Prediction, (SensorReading.node_id == Prediction.node_id) & (SensorReading.timestamp == Prediction.timestamp)
    )

    if node_id:
        query = query.filter(SensorReading.node_id == node_id)
    if panel:
        query = query.filter(SensorNode.panel == panel)
    if risk and risk != "ALL":
        query = query.filter(Prediction.final_risk == risk)

    records = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()

    result = []
    for r, p, n in records:
        result.append({
            "id": r.id,
            "node_id": r.node_id,
            "panel": n.panel,
            "timestamp": r.timestamp.isoformat(),
            "tilt": r.tilt,
            "displacement": r.displacement,
            "vibration": r.vibration,
            "crack_width": r.crack_width,
            "battery": r.battery,
            "tilt_change": r.tilt_change,
            "displacement_rate": r.displacement_rate,
            "vibration_change": r.vibration_change,
            "crack_growth_rate": r.crack_growth_rate,
            "predicted_risk": p.predicted_risk if p else "LOW",
            "anomaly_detected": p.anomaly_detected if p else False,
            "anomaly_score": p.anomaly_score if p else 0.0,
            "final_risk": p.final_risk if p else "LOW",
            "trend": p.trend if p else "STABLE"
        })
    return result

# ----------------- PREDICTIONS ----------------- #
@app.get("/api/predictions", response_model=List[schemas.PredictionResponse])
def get_predictions(
    limit: int = Query(50, ge=1, le=300),
    db: Session = Depends(get_db)
):
    preds = db.query(Prediction).order_by(desc(Prediction.timestamp)).limit(limit).all()
    return [schemas.PredictionResponse.model_validate(p) for p in preds]

@app.get("/api/predictions/{node_id}", response_model=List[schemas.PredictionResponse])
def get_node_predictions(
    node_id: str,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    preds = db.query(Prediction).filter(
        Prediction.node_id == node_id
    ).order_by(desc(Prediction.timestamp)).limit(limit).all()
    preds.reverse()
    return [schemas.PredictionResponse.model_validate(p) for p in preds]

# ----------------- ALERTS ----------------- #
@app.get("/api/alerts", response_model=List[schemas.AlertResponse])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status != "ALL":
        query = query.filter(Alert.status == status)
    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity)
    alerts = query.order_by(desc(Alert.timestamp)).limit(limit).all()
    return [schemas.AlertResponse.model_validate(a) for a in alerts]

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.status = "ACKNOWLEDGED"
    db.commit()
    return {"status": "SUCCESS", "message": f"Alert {alert.alert_code} marked as ACKNOWLEDGED."}

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.status = "RESOLVED"
    db.commit()
    return {"status": "SUCCESS", "message": f"Alert {alert.alert_code} marked as RESOLVED."}

# ----------------- RISK ZONES ----------------- #
@app.get("/api/risk-zones", response_model=List[schemas.RiskZone])
def get_risk_zones(db: Session = Depends(get_db)):
    nodes = db.query(SensorNode).all()
    summaries = []
    for n in nodes:
        pred = db.query(Prediction).filter(Prediction.node_id == n.node_id).order_by(desc(Prediction.timestamp)).first()
        summaries.append({
            "node_id": n.node_id,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "panel": n.panel,
            "current_risk": pred.final_risk if pred else "LOW",
            "anomaly_detected": pred.anomaly_detected if pred else False
        })
    zones = risk_engine.identify_spatial_risk_zones(summaries)
    return [schemas.RiskZone(**z) for z in zones]

# ----------------- ML METRICS ----------------- #
@app.get("/api/ml/metrics", response_model=schemas.MLMetricsResponse)
def get_ml_metrics():
    if not ml_service.metrics:
        ml_service.load_models()
    if not ml_service.metrics:
        raise HTTPException(status_code=500, detail="ML metrics not yet computed. Run train.py first.")
    return schemas.MLMetricsResponse(**ml_service.metrics)

# ----------------- SIMULATION CONTROLS ----------------- #
@app.post("/api/simulation/start", response_model=schemas.SimulationResponse)
def start_simulation():
    simulator.start()
    return schemas.SimulationResponse(
        status="RUNNING",
        message="Sensor network real-time simulation active.",
        simulation_active=True,
        subsidence_active=simulator.subsidence_active,
        stage=simulator.subsidence_stage
    )

@app.post("/api/simulation/stop", response_model=schemas.SimulationResponse)
def stop_simulation():
    simulator.stop()
    return schemas.SimulationResponse(
        status="STOPPED",
        message="Sensor network real-time simulation paused.",
        simulation_active=False,
        subsidence_active=simulator.subsidence_active,
        stage=simulator.subsidence_stage
    )

@app.post("/api/simulation/subsidence", response_model=schemas.SimulationResponse)
def trigger_subsidence_simulation():
    if not simulator.is_running:
        simulator.start()
    simulator.trigger_subsidence()
    return schemas.SimulationResponse(
        status="SUBSIDENCE_TRIGGERED",
        message="Progressive subsidence event triggered on Panel B cluster (N07-N11). Transitioning through deformation stages.",
        simulation_active=True,
        subsidence_active=True,
        stage=simulator.subsidence_stage
    )

@app.post("/api/simulation/reset", response_model=schemas.SimulationResponse)
def reset_simulation(db: Session = Depends(get_db)):
    simulator.reset(db)
    return schemas.SimulationResponse(
        status="RESET_COMPLETE",
        message="All sensor nodes restored to baseline normal strata conditions.",
        simulation_active=simulator.is_running,
        subsidence_active=False,
        stage=0
    )
