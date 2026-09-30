import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Activity, Maximize2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-slate-700 text-xs shadow-xl min-w-[150px]">
        <span className="font-mono text-slate-400 block mb-1 font-semibold">{label}</span>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5" style={{ color: item.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}:</span>
            </span>
            <span className="font-mono font-bold text-slate-100">
              {item.value} {item.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SensorCharts = ({ data = [], title = "Real-Time Strata Kinematics Trends" }) => {
  const [activeMetric, setActiveMetric] = useState('all'); // all, displacement, tilt, vibration, crack

  const metricsConfig = {
    all: [
      { key: 'avgDisp', name: 'Displacement', color: '#f97316', unit: 'mm' },
      { key: 'avgTilt', name: 'Tilt Angle', color: '#06b6d4', unit: '°' },
      { key: 'avgVib', name: 'Vibration', color: '#a855f7', unit: 'mm/s' },
      { key: 'avgCrack', name: 'Crack Width', color: '#ef4444', unit: 'mm' },
    ],
    displacement: [{ key: 'avgDisp', name: 'Displacement', color: '#f97316', unit: 'mm' }],
    tilt: [{ key: 'avgTilt', name: 'Tilt Angle', color: '#06b6d4', unit: '°' }],
    vibration: [{ key: 'avgVib', name: 'Vibration', color: '#a855f7', unit: 'mm/s' }],
    crack: [{ key: 'avgCrack', name: 'Crack Width', color: '#ef4444', unit: 'mm' }]
  };

  const selectedSeries = metricsConfig[activeMetric] || metricsConfig.all;

  return (
    <div className="glass-panel rounded-xl p-4 md:p-5 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            {title}
          </h3>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Dynamics' },
            { id: 'displacement', label: 'Displacement' },
            { id: 'tilt', label: 'Tilt' },
            { id: 'vibration', label: 'Vibration' },
            { id: 'crack', label: 'Crack Width' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMetric(tab.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeMetric === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
            Waiting for real-time telemetry stream packets...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                iconType="circle"
              />
              {selectedSeries.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  unit={series.unit}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SensorCharts;
