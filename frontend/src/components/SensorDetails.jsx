import React, { useEffect, useState } from 'react';
import { X, Battery, Cpu, MapPin, Gauge, Shield, Clock, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../services/api';
import { RiskBadge, TrendBadge } from './RiskBadge';

export const SensorDetails = ({ node, onClose }) => {
  const [nodeDetail, setNodeDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!node?.node_id) return;

    let isMounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getNode(node.node_id);
        if (isMounted) setNodeDetail(data);
      } catch (err) {
        console.error('Failed to load node detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [node?.node_id]);

  if (!node) return null;

  const current = nodeDetail || node;
  const readings = (nodeDetail?.recent_readings || []).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    tilt: r.tilt,
    displacement: r.displacement,
    vibration: r.vibration,
    crack: r.crack_width
  }));

  const anomalyScore = current.anomaly_score !== undefined ? current.anomaly_score : 0.05;
  const riskProb = current.risk_probability !== undefined ? current.risk_probability : 0.85;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-industrial-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-cyan-400">
              {current.node_id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Telemetry Node {current.node_id}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {current.panel}
                </span>
                <RiskBadge risk={current.current_risk} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {current.latitude?.toFixed(6)}°N, {current.longitude?.toFixed(6)}°E
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Updated: {new Date(current.last_updated || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Real-time Parameters Grid */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 font-semibold">
              Surface & Subsurface Strata Telemetry
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-industrial-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Tilt / Incline</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{current.tilt}°</span>
              </div>
              <div className="bg-industrial-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Displacement</span>
                <span className="text-xl font-bold font-mono text-orange-400">{current.displacement} mm</span>
              </div>
              <div className="bg-industrial-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Vibration (Velocity)</span>
                <span className="text-xl font-bold font-mono text-purple-400">{current.vibration} mm/s</span>
              </div>
              <div className="bg-industrial-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Crack Width</span>
                <span className="text-xl font-bold font-mono text-red-400">{current.crack_width} mm</span>
              </div>
            </div>
          </div>

          {/* AI Model Inference Gauges */}
          <div className="p-4 rounded-xl bg-industrial-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                  AI Model Dual Inference Diagnostics
                </h4>
              </div>
              <TrendBadge trend={current.trend} size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Isolation Forest Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Isolation Forest Anomaly Score:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {(anomalyScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      anomalyScore > 0.65 ? 'bg-red-500' : anomalyScore > 0.35 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, anomalyScore * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Status: {current.anomaly_detected ? 'ANOMALY DETECTED' : 'NORMAL STATISTICAL BOUNDS'}
                </span>
              </div>

              {/* Random Forest Probability */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Random Forest Risk Certainty:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(riskProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, riskProb * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Classified Category: {current.current_risk}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Telemetry Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Historical Deformation Trend (Recent Readings)
              </h4>
              <span className="text-[11px] font-mono text-slate-500">Node {current.node_id}</span>
            </div>
            <div className="h-[200px] w-full bg-industrial-900/60 p-2 rounded-xl border border-slate-800">
              {readings.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Loading readings history...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={readings}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                    />
                    <Line type="monotone" dataKey="displacement" name="Disp (mm)" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="tilt" name="Tilt (°)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="crack" name="Crack (mm)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Node Battery and Hardware Readiness */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-industrial-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Node Battery: {current.battery}%</span>
            </div>
            <span className="text-slate-500 text-[11px]">
              Virtual Sensor Protocol: ESP32 + LoRa Simulated Gateway
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-industrial-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default SensorDetails;
