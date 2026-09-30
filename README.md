<<<<<<< HEAD
# GeoSentinel AI
### AI-Enabled Real-Time Mine Subsidence Monitoring, Prediction & Early Warning System
**Smart India Hackathon (SIH) 2026**  
- **Problem Statement ID:** SIH26025  
- **Department:** Coal India Limited (Ministry of Coal)  
- **Category:** Hardware / Software Cyber-Physical System  
- **Theme:** Smart Automation  

---

> **CRITICAL ARCHITECTURAL NOTICE:**  
> **"Current prototype uses simulated sensor data for software and AI validation. The backend API is designed for future integration with real ESP32/LoRa sensor nodes."**  
> Physical hardware sensor nodes are not currently deployed in an active mine; realistic kinematic simulation models simulate ground strata physics and deformation behavior.

---

## 1. Problem Statement & Background
Underground coal mining extraction (bord-and-pillar and longwall caving) inevitably induces stress redistribution within the overlying geological strata. As coal seams are extracted, voids cause roof collapse and subsequent progressive overburden fracturing that migrates toward the surface.

This leads to **surface ground subsidence**, characterized by:
- **Vertical Ground Displacement & Settlement:** Formation of subsidence troughs and sinkholes.
- **Differential Ground Tilting / Incline:** Twisting foundations of civil infrastructure and roads.
- **Surface Tensile & Shear Fractures:** Fissuring of soil, damaging agricultural land and aquitards.
- **Vibrations & Micro-Seismic Tremors:** Rock burst tremors and void collapse shocks.
- **Structural Catastrophes & Community Risk:** Threat to nearby human settlements, power pylons, railway alignments, and water reservoirs.

### Existing Approaches vs. Limitations
1. **Periodic Manual Tacheometric / Total Station Surveys:** Performed weekly or monthly; incapable of detecting sudden rapid caving voids between survey intervals.
2. **Satellite InSAR (Interferometric Synthetic Aperture Radar):** High spatial coverage but 6 to 12-day revisit latency, vulnerable to atmospheric noise, cloud cover, and rapid non-linear deformation phase-unwrapping errors.
3. **Stand-Alone Dial Gauges / Extensometers:** Isolated, non-networked instruments requiring dangerous in-person visits to active subsiding zones.

---

## 2. Proposed Solution: GeoSentinel AI
GeoSentinel AI bridges this critical safety gap by delivering an end-to-end cyber-physical intelligence platform featuring:
1. **Low-Cost Distributed Telemetry Architecture:** Simulating / interfacing with low-power wireless sensor nodes measuring tilt, displacement, vibration, crack width, and battery.
2. **Dual-Model AI Anomaly & Risk Stratification:** 
   - **Isolation Forest:** High-dimensional unsupervised anomaly detection for early micro-structural failure signatures.
   - **Random Forest Classifier:** Supervised stratification into four standard strata risk classes: `LOW`, `MODERATE`, `HIGH`, and `CRITICAL`.
3. **Multi-Factor Geotechnical Risk Engine:** Fuses AI model probabilities with kinematic velocities (displacement rate, crack growth rate) and spatial neighbor clusters.
4. **Spatial Geofenced Risk Zones:** Real-time Haversine clustering of neighboring abnormal sensors to generate georeferenced hazard envelopes on interactive GIS maps.
5. **Zero-Latency WebSocket Alerts:** Bidirectional event streaming pushing live warnings, automated alert logs, and acknowledgment workflows to miners and geotechnical engineers.

---

## 3. End-to-End System Architecture

```text
       [ Virtual / Real Sensor Nodes (28 Nodes across Panels A, B, C, D) ]
                      │ (Tilt, Disp, Vib, Crack, Battery)
                      ▼
         [ Telemetry Ingestion Gateway / LoRa Gateway ]
                      │ (HTTP POST / WebSocket Streaming)
                      ▼
        [ FastAPI Asynchronous Backend (Python 3.14+) ]
                      │
                      ▼
   [ Data Preprocessing & Kinematic Feature Engineering ]
   ├─ Missing Value Imputation & Physical Clamping
   ├─ Temporal Differences: tilt_change, vibration_change
   ├─ Kinematic Velocities: displacement_rate, crack_growth_rate
   └─ Rolling Windows: rolling_tilt, rolling_displacement, rolling_crack
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ Isolation Forest (150 Trees) ] [ Random Forest Classifier (200 Trees) ]
  • Unsupervised Outlier Isolation • Supervised 4-Class Stratification
  • Continuous Anomaly Score (0-1) • Class Certainty Probabilities
        └─────────────┬─────────────┘
                      │
                      ▼
         [ Multi-Factor Risk Engine ]
   ├─ AI Probability Fusion + Anomaly Score Weighting
   ├─ Kinematic Acceleration Trend (STABLE / INCREASING / RAPIDLY INCREASING)
   └─ Spatial Proximity Clustering (Haversine 650m threshold)
                      │
                      ▼
      [ Spatial Risk Zones & Alert Dispatcher ]
   ├─ AI-Generated Prototype Hazard Envelopes
   └─ Automated Alert Log Generation (ACTIVE / ACKNOWLEDGED / RESOLVED)
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ SQLite Database (SQLAlchemy) ]  [ WebSocket Broadcast Gateway (/ws/live) ]
  • SensorNode Table                │
  • SensorReading Table             │ (Real-Time Push at 2.5s Ticks)
  • Prediction Table                ▼
  • Alert Table           [ React + Vite Dark Industrial Dashboard ]
                           ├─ Interactive Leaflet GIS Mine Map
                           ├─ Recharts Multi-Parameter Kinematics
                           ├─ Real-Time Alarm Panel & Acknowledgment
                           ├─ AI Diagnostics & Confusion Matrix
                           └─ Simulation Controls (Normal, Subsidence, Reset)
```

---

## 4. Technology Stack

### Frontend
- **Framework:** React 18 with Vite build tool
- **Language:** Modern JavaScript (ES6+ Modules)
- **Styling:** Tailwind CSS (Custom Dark Industrial Theme with HSL tokens)
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios (Centralized API service in `services/api.js`)
- **GIS Mapping:** Leaflet 1.9 & React-Leaflet 4.2 with custom animated SVG/DivIcon markers and CartoDB Dark basemaps
- **Data Visualization:** Recharts (LineChart, AreaChart, PieChart, BarChart)
- **Iconography:** Lucide React

### Backend
- **Framework:** FastAPI (High-performance asynchronous Python web framework)
- **Server:** Uvicorn ASGI Server
- **ORM & Database:** SQLAlchemy 2.0 with SQLite database
- **Data Validation:** Pydantic v2 schemas
- **Real-Time Communication:** Native WebSockets (`/ws/live`) with connection pooling

### AI / Machine Learning
- **Core Libraries:** Scikit-Learn, Pandas, NumPy, Joblib
- **Model 1 (Anomaly Detection):** Isolation Forest (`n_estimators=150`, `contamination=0.17`)
- **Model 2 (Risk Stratification):** Random Forest Classifier (`n_estimators=200`, `max_depth=12`, `class_weight='balanced'`)

---

## 5. Sensor Network Topology

The prototype simulates **28 distributed sensor nodes** partitioned across four active extraction panels in the Jharia Coalfield mining basin:

| Panel | Nodes | Target Strata Area | Coordinate Center |
|---|---|---|---|
| **Panel A** | N01 – N07 | North Overburden Barrier Pillar | 23.750° N, 86.415° E |
| **Panel B** | N08 – N14 | Active Extraction Face (Caving Zone) | 23.757° N, 86.419° E |
| **Panel C** | N15 – N21 | South Tailgate Roadway Alignment | 23.764° N, 86.423° E |
| **Panel D** | N22 – N28 | Surface Infrastructure Buffer Zone | 23.771° N, 86.427° E |

Each sensor telemetry record contains:
- `node_id`: Node identifier (e.g., `N07`)
- `latitude` & `longitude`: Georeferenced coordinates (WGS84)
- `panel`: Assigned mining extraction block
- `tilt`: Incline / deviation angle in degrees (0.0° – 18.0°)
- `displacement`: Cumulative vertical deformation in millimeters (0.0 – 140.0 mm)
- `vibration`: Micro-seismic peak particle velocity in mm/s (0.0 – 15.0 mm/s)
- `crack_width`: Surface crack aperture opening in millimeters (0.0 – 48.0 mm)
- `battery`: Node power level in percentage (10% – 100%)
- `status`: Transmitter operational state (`ONLINE`, `OFFLINE`)
- `timestamp`: UTC ISO timestamp

---

## 6. AIML Methodology & Dataset

### Synthetic Dataset Generation (`train.py`)
To train robust models before underground hardware deployment, `backend/train.py` synthesizes **12,000 physically grounded telemetry records** spanning 30 days of mining activity:
- **Strata Physics Simulation:** Reflects empirical subsidence trough behavior (Peck's Gaussian curve and empirical National Coal Board subsidence handbooks).
- **Class Proportions:**
  - `LOW` (~65%): Stable rock strata (tilt < 1.4°, disp < 7.5mm, vib < 0.75mm/s, crack < 1.2mm)
  - `MODERATE` (~18%): Roof sagging and bed separation (tilt 1.5°–3.8°, disp 8.0–24.5mm)
  - `HIGH` (~12%): Shear failure and periodic weighting (tilt 4.0°–7.8°, disp 25.0–58.0mm)
  - `CRITICAL` (~5%): Major void caving and surface fissure emergence (tilt 8.0°–18.0°, disp 60.0–140.0mm)

### Feature Engineering
For every incoming raw sensor payload, the preprocessing engine calculates:
1. `tilt_change`: $\Delta \theta = \theta_t - \theta_{t-1}$
2. `displacement_rate`: $v_d = \frac{d_t - d_{t-1}}{\Delta t}$ (mm/s)
3. `vibration_change`: $\Delta v = v_t - v_{t-1}$
4. `crack_growth_rate`: $v_c = \frac{c_t - c_{t-1}}{\Delta t}$ (mm/s)
5. `rolling_tilt`, `rolling_displacement`, `rolling_vibration`, `rolling_crack`: 5-reading rolling means to smooth transient high-frequency noise.

### Isolation Forest (Anomaly Detection)
- Fits isolation trees on 8 kinematic features.
- Evaluates the path length required to isolate a point. Shorter paths indicate abnormal physical behavior.
- Decision function score is mapped to a normalized 0.0 to 1.0 Anomaly Score.

### Random Forest (Supervised Risk Classification)
- Classifies risk level into `LOW`, `MODERATE`, `HIGH`, `CRITICAL`.
- Generates probability distribution vectors across all classes (e.g. 96% confidence in CRITICAL).
- **Feature Importance:**
  - Displacement: **17.7%**
  - Vibration: **17.2%**
  - Tilt: **14.4%**
  - Crack Width: **13.3%**
  - Displacement Rate: **11.8%**
  - Crack Growth Rate: **9.6%**
  - Vibration Change: **8.3%**
  - Tilt Change: **7.7%**

### Multi-Factor Geotechnical Risk Engine
Combines:
$$\text{Score} = \text{Score}_{\text{RF\_Base}} \pm \Delta(\text{Certainty}) + 12 \cdot (\text{AnomalyScore}) + \text{Bonus}_{\text{Trend}} + \text{Bonus}_{\text{Spatial}}$$
- Outputs final risk level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) and Kinematic Trend (`STABLE`, `INCREASING`, `RAPIDLY INCREASING`).

### Spatial Risk Zone Analysis
- Calculates great-circle distances between abnormal nodes using the Haversine formula.
- If two or more neighboring nodes within **650 meters** exhibit elevated deformation or anomalies, a dynamic **Risk Zone** is constructed.
- Displayed on the GIS map with explicit warning: *"AI-generated prototype risk zones. Not official engineering safety boundaries."*

---

## 7. Project Structure

```text
geo-sentinel-ai/
│
├── README.md                           # Comprehensive documentation & setup guide
│
├── backend/
│   ├── requirements.txt                # Python backend dependencies
│   ├── main.py                         # FastAPI routes, WebSocket & background loop
│   ├── config.py                       # Configuration constants, CORS, paths
│   ├── database.py                     # SQLAlchemy database engine and session
│   ├── models.py                       # SQLAlchemy ORM models (Node, Reading, Prediction, Alert)
│   ├── schemas.py                      # Pydantic request/response schemas
│   ├── simulator.py                    # Multi-node progressive subsidence simulator
│   ├── ml_service.py                   # Model loader, preprocessing & dual inference
│   ├── risk_engine.py                  # Multi-factor risk engine & Haversine clustering
│   ├── websocket_manager.py            # Client connection pooling & broadcast manager
│   ├── train.py                        # Dataset synthesis, model training & evaluation
│   │
│   └── models/
│       ├── synthetic_dataset.csv       # 12,000 synthetic geological records
│       ├── anomaly_model.joblib        # Trained Isolation Forest model
│       ├── risk_model.joblib           # Trained Random Forest Classifier
│       └── metrics.json                # Model accuracy, precision, recall, F1, confusion matrix
│
└── frontend/
    ├── package.json                    # Frontend npm dependencies and scripts
    ├── vite.config.js                  # Vite React configuration
    ├── index.html                      # HTML entry with Google Inter & JetBrains Mono fonts
    ├── tailwind.config.js              # Dark industrial color tokens and animation extensions
    ├── postcss.config.js               # PostCSS config for Tailwind
    ├── .env                            # API URL and WebSocket endpoint configuration
    │
    └── src/
        ├── main.jsx                    # React root render with Router and LiveProvider
        ├── App.jsx                     # Layout shell, Sidebar, Header, Routes
        ├── index.css                   # Global styles, Leaflet dark map fix, DivIcon markers
        │
        ├── services/
        │   └── api.js                  # Centralized Axios client for all backend endpoints
        │
        ├── context/
        │   └── LiveContext.jsx         # WebSocket client, state store & useLive hook
        │
        ├── components/
        │   ├── Sidebar.jsx             # Responsive navigation with live alert badges
        │   ├── Header.jsx              # Status bar, real-time clock, WebSocket status
        │   ├── StatCard.jsx            # Industrial KPI metric cards with glow borders
        │   ├── RiskBadge.jsx           # Color-coded badges for Risk and Kinematic Trend
        │   ├── SensorTable.jsx         # Searchable, filterable, sortable 28-node table
        │   ├── SensorDetails.jsx       # Modal inspector with gauges and historical graphs
        │   ├── MineMap.jsx             # Leaflet GIS map with custom pulsing DivIcons
        │   ├── RiskZones.jsx           # Spatial cluster hazard envelope cards
        │   ├── AlertPanel.jsx          # Alarm management (Acknowledge / Resolve)
        │   ├── SensorCharts.jsx        # Recharts live multi-parameter kinematics
        │   ├── RiskDistribution.jsx    # Donut chart of network risk stratification
        │   ├── SimulationControls.jsx  # Start, Stop, Simulate Subsidence, Reset
        │   └── LoadingState.jsx        # Asynchronous loading and error indicators
        │
        └── pages/
            ├── Dashboard.jsx           # Comprehensive operational command center
            ├── LiveMonitoring.jsx      # Full-table real-time 28-node telemetry
            ├── MineMapPage.jsx         # Fullscreen GIS map with filter overlays
            ├── AIPrediction.jsx        # ML metrics, confusion matrix & feature importance
            ├── Alerts.jsx              # Active, acknowledged and resolved alerts feed
            ├── History.jsx             # Time-series telemetry logs and CSV export
            └── SystemHealth.jsx        # Service health, battery telemetry, runtime stats
```

---

## 8. Backend API Endpoints

### System & Health
- `GET /api/health`: Basic service liveness check.
- `GET /api/system-health`: Detailed infrastructure diagnostics, battery telemetry, and uptime.

### Dashboard & Analytics
- `GET /api/dashboard`: Aggregated network status, risk distribution, recent alerts, and active risk zones.
- `GET /api/risk-zones`: Active spatial risk zones generated by neighbor clustering.
- `GET /api/ml/metrics`: Evaluation metrics (accuracy, precision, recall, F1, confusion matrix, feature importance).

### Sensor Nodes & Telemetry
- `GET /api/nodes`: List of all 28 sensor nodes with latest telemetry, risk, and trend.
- `GET /api/nodes/{node_id}`: Detailed telemetry, prediction history, and active alerts for a single node.
- `GET /api/readings`: Raw telemetry readings log (query params: `node_id`, `limit`).
- `GET /api/readings/{node_id}`: Time-series historical readings for plotting.
- `GET /api/history`: Multi-parameter historical audit records with filters.

### AI Predictions
- `GET /api/predictions`: Recent AI inference outputs across the network.
- `GET /api/predictions/{node_id}`: Prediction history for a specific sensor node.

### Alerts Management
- `GET /api/alerts`: List of geotechnical alerts (query params: `status`, `severity`, `limit`).
- `POST /api/alerts/{alert_id}/acknowledge`: Mark an alert as `ACKNOWLEDGED`.
- `POST /api/alerts/{alert_id}/resolve`: Mark an alert as `RESOLVED`.

### Simulation Orchestration
- `POST /api/simulation/start`: Resume real-time background telemetry simulation.
- `POST /api/simulation/stop`: Pause real-time simulation.
- `POST /api/simulation/subsidence`: Initiate progressive multi-stage caving subsidence event.
- `POST /api/simulation/reset`: Reset all nodes to baseline normal strata conditions.

### WebSocket
- `WebSocket ws://127.0.0.1:8000/ws/live`: Real-time bidirectional telemetry stream broadcasting updates every 2.5 seconds.

---

## 9. Installation & Running Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ and npm (Tested on Node v24.19.0)

---

### Step 1: Backend Setup & ML Model Training

Open a terminal and navigate to the `backend` folder:
```powershell
cd backend
```

Create a virtual environment (optional but recommended):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:
```powershell
pip install -r requirements.txt
```

Train the Isolation Forest and Random Forest models on 12,000 synthetic records:
```powershell
python train.py
```
*(This generates `synthetic_dataset.csv`, `anomaly_model.joblib`, `risk_model.joblib`, and `metrics.json` inside `backend/models/`)*

Start the FastAPI backend server:
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- **Backend API URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **WebSocket Endpoint:** `ws://127.0.0.1:8000/ws/live`

---

### Step 2: Frontend Setup & Development Server

Open a second terminal and navigate to the `frontend` folder:
```powershell
cd frontend
```

Install npm dependencies:
```powershell
npm install
```

Start the Vite development server:
```powershell
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 10. Demonstration & Validation Procedure

1. **Verify Live Baseline Strata:**
   - On the **Dashboard**, observe 28 sensor nodes distributed across Panels A, B, C, and D.
   - All nodes initially show `LOW RISK` with normal small physical micro-variations.
   - The **Strata Kinematics Trends** chart and **Mine Map** update in real-time without refreshing the page via WebSockets.
2. **Trigger Progressive Subsidence Event:**
   - In the **Geological Simulation Controller** bar, click **"Simulate Subsidence"**.
   - Watch the subsidence progress through 12 progressive simulation cycles:
     - **Stage 1–3:** Initial flexure & bed separation (`LOW` → `MODERATE`).
     - **Stage 4–7:** Overburden sagging & shear strain acceleration (`MODERATE` → `HIGH`).
     - **Stage 8–12:** Main roof caving void rupture (`HIGH` → `CRITICAL`).
   - The target cluster in **Panel B (N07, N08, N09, N10, N11)** transitions through color changes on the Leaflet map (Green → Yellow → Orange → Red with pulsing warning rings).
   - An **AI-Generated Risk Zone** (`RZ-PANEL-B-01`) is formed around the cluster with an orange/red geofence circle.
   - Automated alerts are generated in the **Alerts** feed.
3. **Acknowledge and Resolve Hazard Warnings:**
   - Navigate to the **Alerts** page or use the Dashboard alert panel.
   - Click **"Acknowledge"** to verify that the status transitions from `ACTIVE` to `ACKNOWLEDGED`.
   - Click **"Resolve"** to confirm resolution with the backend SQLite database.
4. **Inspect AI Diagnostics:**
   - Navigate to **AI Prediction** to inspect the 100% test accuracy, confusion matrix, and feature importance bar chart.
5. **Inspect Individual Sensor Telemetry:**
   - Click any sensor node on the **Mine Map** or **Live Monitoring** table to open the **Sensor Details Inspector**.
   - Review live parameter values, Isolation Forest anomaly score bar, Random Forest certainty percentage, and historical deformation line graph.
6. **Reset Simulation:**
   - In the top simulation controller, click **"Reset Simulation"**.
   - All sensors are immediately restored to baseline strata conditions, active alerts are resolved, and the mine index returns to LOW risk.

---

## 11. Future Hardware Integration Roadmap

The software architecture is engineered for direct drop-in integration with field hardware:
1. **Sensor Node Edge Hardware:**
   - **MCU:** ESP32-S3 or ESP32-WROOM-32 with deep-sleep power management.
   - **Tilt & Vibration:** InvenSense MPU-6050 (6-axis accelerometer + gyroscope) or Bosch BNO055 (absolute orientation sensor).
   - **Displacement & Crack Growth:** Linear Variable Differential Transformers (LVDT) or optical potentiometric crack meters.
   - **Power:** 3.7V 18650 Li-ion battery bank paired with a 5V/2W solar harvesting circuit.
2. **Transmission Layer:**
   - Long-range LoRa SX1276 / SX1262 transceivers (868 MHz / 433 MHz) providing 2–5 km range through underground mine drifts.
   - LoRaWAN Gateway positioned at the surface pithead or mine shaft station.
3. **Ingestion API:**
   - The gateway relays JSON payloads directly to `POST /api/readings` on the FastAPI server, matching the exact schema utilized by the simulation engine.

---

## 12. Limitations & Disclaimers
- **Simulation Prototype:** As stated in Section 2, all sensor data in this prototype is generated by the kinematic simulation engine for software, algorithm, and AI validation.
- **Risk Zones:** AI-generated risk zone polygons are prototype clustering indicators and do not replace statutory geotechnical boundary surveys required by the Directorate General of Mines Safety (DGMS).
- **Network Dependency:** Real-time web visualization requires WebSocket connectivity between the browser and the FastAPI service.

---

## 13. License
Developed for the **Smart India Hackathon (SIH 2026)**.  
Department: **Coal India Limited (CIL)**.  
Theme: **Smart Automation**.
=======
# GeoSentinelAi
>>>>>>> 449340d2a4fa58edf4beb40acbcb257a10c60632
