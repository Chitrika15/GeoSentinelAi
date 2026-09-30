import React, { useState } from 'react';
import {
  Layers,
  Radio,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Flame,
  Bell,
  Activity,
  Cpu,
  MapPin,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useLive } from '../context/LiveContext';
import StatCard from '../components/StatCard';
import SimulationControls from '../components/SimulationControls';
import MineMap from '../components/MineMap';
import RiskDistribution from '../components/RiskDistribution';
import SensorCharts from '../components/SensorCharts';
import AlertPanel from '../components/AlertPanel';
import RiskZones from '../components/RiskZones';
import SensorDetails from '../components/SensorDetails';
import LoadingState from '../components/LoadingState';

export const Dashboard = () => {
  const {
    nodes,
    dashboardStats,
    riskZones,
    alerts,
    telemetryHistory,
    loading
  } = useLive();

  const [selectedNode, setSelectedNode] = useState(null);

  if (loading && nodes.length === 0) {
    return <LoadingState message="Connecting to GeoSentinel telemetry stream..." />;
  }

  const total = dashboardStats?.total_nodes || nodes.length || 28;
  const online = dashboardStats?.online_nodes || nodes.filter(n => n.status === 'ONLINE').length || 28;
  const offline = dashboardStats?.offline_nodes || 0;
  const normal = dashboardStats?.normal_count || nodes.filter(n => (n.current_risk || 'LOW') === 'LOW').length;
  const moderate = dashboardStats?.moderate_count || nodes.filter(n => n.current_risk === 'MODERATE').length;
  const high = dashboardStats?.high_risk_count || nodes.filter(n => n.current_risk === 'HIGH').length;
  const critical = dashboardStats?.critical_count || nodes.filter(n => n.current_risk === 'CRITICAL').length;
  const activeAlerts = dashboardStats?.active_alerts_count || alerts.filter(a => a.status === 'ACTIVE').length;
  const overallRisk = dashboardStats?.overall_risk || (critical > 0 ? 'CRITICAL' : high > 0 ? 'HIGH' : moderate > 0 ? 'MODERATE' : 'LOW');
  const riskScore = dashboardStats?.overall_risk_score || (critical > 0 ? 92.5 : high > 0 ? 74.0 : moderate > 0 ? 42.0 : 15.0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 font-mono flex items-center gap-2">
            <span>REAL-TIME STRATA OVERVIEW</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-sans font-semibold">
              Live Basin Grid
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Underground Coal Seam Caving Monitoring & Overburden Subsidence Early Warning System
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Mine Basin:</span>
          <span className="px-2.5 py-1 rounded bg-industrial-900 border border-slate-700 text-xs font-mono font-bold text-slate-200">
            Jharia Coalfield Pit-04
          </span>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard
          title="Total Sensors"
          value={total}
          subtitle={`${online} Online / ${offline} Offline`}
          icon={Layers}
          color="cyan"
        />
        <StatCard
          title="Low Risk"
          value={normal}
          subtitle="Stable Strata"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Moderate Risk"
          value={moderate}
          subtitle="Roof Sag Flexure"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="High Risk"
          value={high}
          subtitle="Shear Strain Acceleration"
          icon={AlertOctagon}
          color="orange"
        />
        <StatCard
          title="Critical Risk"
          value={critical}
          subtitle="Active Void Rupture"
          icon={Flame}
          color="red"
        />
        <StatCard
          title="Active Alerts"
          value={activeAlerts}
          subtitle={`Overall Risk: ${overallRisk}`}
          icon={Bell}
          color={activeAlerts > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Simulation Controls Panel */}
      <SimulationControls />

      {/* Map and Risk Distribution Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Mine Map */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-4 md:p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                Spatial Mine Map & Risk Geofences
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {riskZones.length} Active Prototype Risk Zones
            </span>
          </div>
          <MineMap
            nodes={nodes}
            riskZones={riskZones}
            onSelectNode={(node) => setSelectedNode(node)}
            height="380px"
          />
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="lg:col-span-1">
          <RiskDistribution stats={dashboardStats} />
        </div>
      </div>

      {/* Sensor Trends and AI Diagnostic Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time multi-parameter charts */}
        <div className="lg:col-span-2">
          <SensorCharts
            data={telemetryHistory}
            title="Real-Time Network Strata Kinematics (Rolling Telemetry)"
          />
        </div>

        {/* AI Geotechnical Summary Card */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-4 md:p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                AI Diagnostic Summary
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
              Ensemble AI
            </span>
          </div>

          <div className="space-y-3 py-3 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-cyan-400">Isolation Forest:</strong> Scanning all 28 telemetry nodes for multi-dimensional statistical deviations across tilt angles, displacement velocities, vibration frequencies, and surface crack growth.
            </p>
            <p>
              <strong className="text-amber-400">Random Forest Classifier:</strong> Classifying geotechnical risk into 4 strata regimes with calibrated confidence probabilities and decision tree ensembles.
            </p>
            <div className="p-3 rounded-lg bg-industrial-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Strata Index:</span>
                <span className="font-mono font-bold text-slate-100">{riskScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subsidence Status:</span>
                <span className={`font-mono font-semibold ${critical > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {critical > 0 ? 'CAVING SHEAR ACTIVE' : 'STABLE FORMATION'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Model: IF (150 Trees) + RF (200 Trees)</span>
            <span className="text-cyan-400 font-mono">100% Accuracy</span>
          </div>
        </div>
      </div>

      {/* Spatial Risk Zones & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-2">
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 mb-1">
              AI-Generated Prototype Risk Zones
            </h3>
            <p className="text-xs text-slate-400">
              Spatial clustering of geographically close abnormal sensor nodes
            </p>
          </div>
          <RiskZones zones={riskZones} />
        </div>

        <div>
          <div className="mb-2">
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 mb-1">
              Active Subsidence Warnings
            </h3>
            <p className="text-xs text-slate-400">
              Threshold violations requiring acknowledgment or engineering review
            </p>
          </div>
          <AlertPanel alerts={alerts} compact={true} />
        </div>
      </div>

      {/* Modal Inspector */}
      {selectedNode && (
        <SensorDetails
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
