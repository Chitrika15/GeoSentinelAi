import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import numpy as np
from sqlalchemy.orm import Session

from database import SessionLocal
from models import SensorNode, SensorReading, Prediction, Alert
from ml_service import ml_service
from risk_engine import risk_engine
from websocket_manager import ws_manager
from config import SIMULATION_INTERVAL_SECONDS, TOTAL_NODES_COUNT, PANELS

logger = logging.getLogger("geosentinel.simulator")

class SensorNetworkSimulator:
    def __init__(self):
        self.is_running: bool = False
        self.subsidence_active: bool = False
        self.subsidence_stage: int = 0
        self.max_subsidence_stages: int = 12
        self.subsidence_target_nodes: List[str] = ["N07", "N08", "N09", "N10", "N11"] # Panel B cluster
        self._task: Optional[asyncio.Task] = None
        self.previous_cache: Dict[str, Dict[str, Any]] = {}
        self.history_cache: Dict[str, List[Dict[str, Any]]] = {}

    def initialize_sensor_nodes(self, db: Session):
        """
        Seeds 28 spatial sensor nodes across Panels A, B, C, D if not already present.
        """
        count = db.query(SensorNode).count()
        if count >= TOTAL_NODES_COUNT:
            # Populate cache from DB
            nodes = db.query(SensorNode).all()
            for n in nodes:
                self.previous_cache[n.node_id] = {
                    "tilt": n.tilt,
                    "displacement": n.displacement,
                    "vibration": n.vibration,
                    "crack_width": n.crack_width,
                    "battery": n.battery,
                    "last_updated": n.last_updated
                }
            return

        logger.info(f"Seeding {TOTAL_NODES_COUNT} sensor nodes in geological grid...")
        
        # Clear existing partial nodes if any
        db.query(Alert).delete()
        db.query(Prediction).delete()
        db.query(SensorReading).delete()
        db.query(SensorNode).delete()
        db.commit()

        # Coordinates anchored in active Jharia coal mining basin
        base_lat = 23.7500
        base_lon = 86.4150

        now = datetime.utcnow()

        for i in range(1, TOTAL_NODES_COUNT + 1):
            node_id = f"N{i:02d}"
            panel_idx = (i - 1) % len(PANELS)
            panel = PANELS[panel_idx]

            # Spatially clustered by panel
            lat_offset = (panel_idx * 0.007) + ((i % 7) * 0.0015) + (random.uniform(-0.0003, 0.0003))
            lon_offset = ((i % 7) * 0.0025) + (panel_idx * 0.004) + (random.uniform(-0.0003, 0.0003))

            lat = round(base_lat + lat_offset, 6)
            lon = round(base_lon + lon_offset, 6)

            # Baseline normal healthy values
            tilt = round(random.uniform(0.1, 0.8), 2)
            displacement = round(random.uniform(0.5, 4.5), 2)
            vibration = round(random.uniform(0.05, 0.45), 2)
            crack_width = round(random.uniform(0.0, 0.8), 2)
            battery = round(random.uniform(85.0, 99.0), 1)

            node = SensorNode(
                node_id=node_id,
                latitude=lat,
                longitude=lon,
                panel=panel,
                tilt=tilt,
                displacement=displacement,
                vibration=vibration,
                crack_width=crack_width,
                battery=battery,
                status="ONLINE",
                last_updated=now
            )
            db.add(node)

            self.previous_cache[node_id] = {
                "tilt": tilt,
                "displacement": displacement,
                "vibration": vibration,
                "crack_width": crack_width,
                "battery": battery,
                "last_updated": now
            }
            self.history_cache[node_id] = []

        db.commit()

        # Seed initial historical readings for each node so charts immediately have data
        for i in range(1, TOTAL_NODES_COUNT + 1):
            nid = f"N{i:02d}"
            base_node = db.query(SensorNode).filter(SensorNode.node_id == nid).first()
            if not base_node:
                continue

            for hist_step in range(10, 0, -1):
                t = now - timedelta(seconds=hist_step * 15)
                # Small baseline noise
                t_noise = max(0.0, base_node.tilt + random.uniform(-0.05, 0.05))
                d_noise = max(0.0, base_node.displacement + random.uniform(-0.1, 0.1))
                v_noise = max(0.0, base_node.vibration + random.uniform(-0.03, 0.03))
                c_noise = max(0.0, base_node.crack_width + random.uniform(-0.02, 0.02))

                reading = SensorReading(
                    node_id=nid,
                    timestamp=t,
                    tilt=round(t_noise, 2),
                    displacement=round(d_noise, 2),
                    vibration=round(v_noise, 2),
                    crack_width=round(c_noise, 2),
                    battery=base_node.battery,
                    tilt_change=0.0,
                    displacement_rate=0.0,
                    vibration_change=0.0,
                    crack_growth_rate=0.0,
                    rolling_tilt=round(t_noise, 2),
                    rolling_displacement=round(d_noise, 2),
                    rolling_vibration=round(v_noise, 2),
                    rolling_crack=round(c_noise, 2)
                )
                db.add(reading)

                pred = Prediction(
                    node_id=nid,
                    timestamp=t,
                    anomaly_detected=False,
                    anomaly_score=0.05,
                    predicted_risk="LOW",
                    risk_probability=0.95,
                    trend="STABLE",
                    final_risk="LOW"
                )
                db.add(pred)

        db.commit()
        logger.info(f"Initialized {TOTAL_NODES_COUNT} sensor nodes with baseline history.")

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.info("Real-Time Simulation Engine Started.")

    def stop(self):
        self.is_running = False
        logger.info("Real-Time Simulation Engine Stopped.")

    def trigger_subsidence(self):
        self.subsidence_active = True
        self.subsidence_stage = 1
        logger.info(f"Subsidence Simulation Initiated on Cluster: {self.subsidence_target_nodes}")

    def reset(self, db: Session):
        """
        Resets all sensors to baseline normal strata conditions,
        resolves alerts, and clears progressive subsidence simulation.
        """
        self.subsidence_active = False
        self.subsidence_stage = 0

        now = datetime.utcnow()
        nodes = db.query(SensorNode).all()
        for node in nodes:
            node.tilt = round(random.uniform(0.15, 0.85), 2)
            node.displacement = round(random.uniform(0.8, 4.2), 2)
            node.vibration = round(random.uniform(0.08, 0.45), 2)
            node.crack_width = round(random.uniform(0.0, 0.6), 2)
            node.battery = max(70.0, node.battery)
            node.status = "ONLINE"
            node.last_updated = now

            self.previous_cache[node.node_id] = {
                "tilt": node.tilt,
                "displacement": node.displacement,
                "vibration": node.vibration,
                "crack_width": node.crack_width,
                "battery": node.battery,
                "last_updated": now
            }
            self.history_cache[node.node_id] = []

        # Mark all active alerts as RESOLVED
        active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").all()
        for a in active_alerts:
            a.status = "RESOLVED"

        db.commit()
        logger.info("Simulation successfully reset to baseline normal strata conditions.")

    async def step(self, db: Session):
        """
        Executes a single real-time simulation tick across all sensor nodes:
        1. Telemetry generation (normal noise or progressive subsidence event)
        2. Feature engineering & preprocessing
        3. Isolation Forest & Random Forest dual inference
        4. Kinematic trend & spatial neighbor risk engine fusion
        5. Database record creation & alert triggering
        6. WebSocket broadcast to connected frontend clients
        """
        now = datetime.utcnow()
        nodes = db.query(SensorNode).all()

        # Progress subsidence stage if active
        if self.subsidence_active:
            if self.subsidence_stage < self.max_subsidence_stages:
                self.subsidence_stage += 1
            logger.info(f"Subsidence Event Progressing -> Stage {self.subsidence_stage}/{self.max_subsidence_stages}")

        updated_node_payloads = []
        new_alerts = []

        # First pass: compute preliminary telemetry & features
        node_intermediate = []
        for node in nodes:
            prev = self.previous_cache.get(node.node_id, {})
            is_target = self.subsidence_active and (node.node_id in self.subsidence_target_nodes)

            # Generate sensor readings
            if is_target:
                # Progressive escalation over multiple simulation stages:
                # Stage 1-3: NORMAL -> MODERATE
                # Stage 4-7: MODERATE -> HIGH
                # Stage 8-12: HIGH -> CRITICAL
                stage_ratio = self.subsidence_stage / float(self.max_subsidence_stages)
                
                target_tilt = 0.5 + (stage_ratio ** 1.3) * 11.5 + random.uniform(-0.2, 0.3)
                target_disp = 2.0 + (stage_ratio ** 1.4) * 88.0 + random.uniform(-0.5, 0.8)
                target_vib = 0.2 + (stage_ratio ** 1.2) * 8.5 + random.uniform(-0.1, 0.2)
                target_crack = 0.1 + (stage_ratio ** 1.3) * 26.0 + random.uniform(-0.1, 0.3)

                tilt = max(0.1, round(target_tilt, 2))
                displacement = max(0.5, round(target_disp, 2))
                vibration = max(0.05, round(target_vib, 2))
                crack_width = max(0.0, round(target_crack, 2))
            else:
                # Stable normal physical baseline with realistic noise
                base_tilt = prev.get("tilt", 0.5)
                base_disp = prev.get("displacement", 2.0)
                base_vib = prev.get("vibration", 0.2)
                base_crack = prev.get("crack_width", 0.1)

                tilt = max(0.05, round(base_tilt + random.uniform(-0.03, 0.03), 2))
                displacement = max(0.2, round(base_disp + random.uniform(-0.06, 0.08), 2))
                vibration = max(0.02, round(base_vib + random.uniform(-0.02, 0.02), 2))
                crack_width = max(0.0, round(base_crack + random.uniform(-0.01, 0.02), 2))

            # Battery slow discharge
            battery = max(10.0, round(node.battery - random.uniform(0.0, 0.005), 1))

            raw_data = {
                "tilt": tilt,
                "displacement": displacement,
                "vibration": vibration,
                "crack_width": crack_width,
                "battery": battery
            }

            hist = self.history_cache.get(node.node_id, [])
            features = ml_service.preprocess_reading(
                current_data=raw_data,
                previous_data=prev,
                history_window=hist,
                time_delta_seconds=SIMULATION_INTERVAL_SECONDS
            )

            # ML Inference: Isolation Forest + Random Forest
            ml_pred = ml_service.predict(features)
            trend = risk_engine.compute_temporal_trend(features, hist)

            node_intermediate.append({
                "node": node,
                "raw_data": raw_data,
                "features": features,
                "ml_pred": ml_pred,
                "trend": trend
            })

        # Second pass: compute spatial risk zones & final risk fusion
        # Prepare list for neighbor detection
        pseudo_node_list = []
        for item in node_intermediate:
            pseudo_node_list.append({
                "node_id": item["node"].node_id,
                "latitude": item["node"].latitude,
                "longitude": item["node"].longitude,
                "panel": item["node"].panel,
                "current_risk": item["ml_pred"]["predicted_risk"],
                "anomaly_detected": item["ml_pred"]["anomaly_detected"]
            })

        # Finalize and persist each node
        for item in node_intermediate:
            node = item["node"]
            raw_data = item["raw_data"]
            features = item["features"]
            ml_pred = item["ml_pred"]
            trend = item["trend"]

            # Count nearby abnormal sensors within 650m
            nearby_abnormal = 0
            for other in pseudo_node_list:
                if other["node_id"] != node.node_id and (other["current_risk"] in ["HIGH", "CRITICAL"] or other["anomaly_detected"]):
                    d = risk_engine.haversine_distance_meters(node.latitude, node.longitude, other["latitude"], other["longitude"])
                    if d <= 650.0:
                        nearby_abnormal += 1

            final_risk, final_score = risk_engine.evaluate_fused_risk(
                features=features,
                ml_prediction=ml_pred,
                trend=trend,
                nearby_abnormal_count=nearby_abnormal
            )

            # Update SensorNode state in DB
            node.tilt = raw_data["tilt"]
            node.displacement = raw_data["displacement"]
            node.vibration = raw_data["vibration"]
            node.crack_width = raw_data["crack_width"]
            node.battery = raw_data["battery"]
            node.last_updated = now

            # Save SensorReading
            reading = SensorReading(
                node_id=node.node_id,
                timestamp=now,
                tilt=raw_data["tilt"],
                displacement=raw_data["displacement"],
                vibration=raw_data["vibration"],
                crack_width=raw_data["crack_width"],
                battery=raw_data["battery"],
                tilt_change=features["tilt_change"],
                displacement_rate=features["displacement_rate"],
                vibration_change=features["vibration_change"],
                crack_growth_rate=features["crack_growth_rate"],
                rolling_tilt=features["rolling_tilt"],
                rolling_displacement=features["rolling_displacement"],
                rolling_vibration=features["rolling_vibration"],
                rolling_crack=features["rolling_crack"]
            )
            db.add(reading)

            # Save Prediction
            prediction = Prediction(
                node_id=node.node_id,
                timestamp=now,
                anomaly_detected=ml_pred["anomaly_detected"],
                anomaly_score=ml_pred["anomaly_score"],
                predicted_risk=ml_pred["predicted_risk"],
                risk_probability=ml_pred["risk_probability"],
                trend=trend,
                final_risk=final_risk
            )
            db.add(prediction)

            # Update cache
            self.previous_cache[node.node_id] = {
                "tilt": raw_data["tilt"],
                "displacement": raw_data["displacement"],
                "vibration": raw_data["vibration"],
                "crack_width": raw_data["crack_width"],
                "battery": raw_data["battery"],
                "last_updated": now
            }
            if node.node_id not in self.history_cache:
                self.history_cache[node.node_id] = []
            self.history_cache[node.node_id].append(raw_data)
            if len(self.history_cache[node.node_id]) > 10:
                self.history_cache[node.node_id].pop(0)

            # Automated Alert Triggering for HIGH and CRITICAL conditions
            if final_risk in ["HIGH", "CRITICAL"]:
                # Check if there is already an active alert for this node within the last 3 minutes
                recent_alert = db.query(Alert).filter(
                    Alert.node_id == node.node_id,
                    Alert.status == "ACTIVE"
                ).first()

                if not recent_alert:
                    alert_code = f"ALT-{node.node_id}-{int(now.timestamp())}"
                    msg = (
                        f"CRITICAL SUBSIDENCE ALERT: Rapid strata shear detected at {node.node_id} ({node.panel}). "
                        f"Disp: {raw_data['displacement']}mm, Tilt: {raw_data['tilt']}°, Crack: {raw_data['crack_width']}mm."
                        if final_risk == "CRITICAL"
                        else
                        f"ELEVATED RISK WARNING: Overburden deformation acceleration at {node.node_id} ({node.panel}). "
                        f"Disp: {raw_data['displacement']}mm, Trend: {trend}."
                    )
                    alert = Alert(
                        alert_code=alert_code,
                        node_id=node.node_id,
                        panel=node.panel,
                        severity=final_risk,
                        message=msg,
                        risk_probability=ml_pred["risk_probability"],
                        trend=trend,
                        timestamp=now,
                        status="ACTIVE"
                    )
                    db.add(alert)
                    new_alerts.append({
                        "id": 0, # Will be set on commit
                        "alert_code": alert_code,
                        "node_id": node.node_id,
                        "panel": node.panel,
                        "severity": final_risk,
                        "message": msg,
                        "risk_probability": ml_pred["risk_probability"],
                        "trend": trend,
                        "timestamp": now.isoformat(),
                        "status": "ACTIVE"
                    })

            # Append to broadcast payload
            updated_node_payloads.append({
                "node_id": node.node_id,
                "latitude": node.latitude,
                "longitude": node.longitude,
                "panel": node.panel,
                "tilt": node.tilt,
                "displacement": node.displacement,
                "vibration": node.vibration,
                "crack_width": node.crack_width,
                "battery": node.battery,
                "status": node.status,
                "last_updated": now.isoformat(),
                "current_risk": final_risk,
                "risk_score": final_score,
                "anomaly_detected": ml_pred["anomaly_detected"],
                "anomaly_score": ml_pred["anomaly_score"],
                "risk_probability": ml_pred["risk_probability"],
                "trend": trend
            })

        db.commit()

        # Identify Spatial Risk Zones across active nodes
        risk_zones = risk_engine.identify_spatial_risk_zones(updated_node_payloads)

        # Compute dashboard summary stats
        normal_count = sum(1 for n in updated_node_payloads if n["current_risk"] == "LOW")
        moderate_count = sum(1 for n in updated_node_payloads if n["current_risk"] == "MODERATE")
        high_count = sum(1 for n in updated_node_payloads if n["current_risk"] == "HIGH")
        critical_count = sum(1 for n in updated_node_payloads if n["current_risk"] == "CRITICAL")
        active_alerts_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()

        if critical_count > 0:
            overall_risk = "CRITICAL"
        elif high_count > 0:
            overall_risk = "HIGH"
        elif moderate_count > 0:
            overall_risk = "MODERATE"
        else:
            overall_risk = "LOW"

        avg_score = float(np.mean([n["risk_score"] for n in updated_node_payloads]))

        # Broadcast real-time WebSocket packet
        ws_payload = {
            "type": "TELEMETRY_UPDATE",
            "timestamp": now.isoformat(),
            "simulation_active": self.is_running,
            "subsidence_active": self.subsidence_active,
            "subsidence_stage": self.subsidence_stage,
            "stats": {
                "total_nodes": len(updated_node_payloads),
                "online_nodes": sum(1 for n in updated_node_payloads if n["status"] == "ONLINE"),
                "offline_nodes": sum(1 for n in updated_node_payloads if n["status"] != "ONLINE"),
                "normal_count": normal_count,
                "moderate_count": moderate_count,
                "high_risk_count": high_count,
                "critical_count": critical_count,
                "active_alerts_count": active_alerts_count,
                "overall_risk": overall_risk,
                "overall_risk_score": round(avg_score, 1)
            },
            "nodes": updated_node_payloads,
            "risk_zones": risk_zones,
            "new_alerts": new_alerts
        }

        await ws_manager.broadcast(ws_payload)

simulator = SensorNetworkSimulator()
