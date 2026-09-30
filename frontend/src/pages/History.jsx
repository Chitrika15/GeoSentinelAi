import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Download, Filter, RefreshCw, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../services/api';
import { RiskBadge, TrendBadge } from '../components/RiskBadge';
import LoadingState from '../components/LoadingState';

export const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState('ALL');
  const [selectedPanel, setSelectedPanel] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [limit, setLimit] = useState(100);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = { limit };
      if (selectedNode !== 'ALL') params.node_id = selectedNode;
      if (selectedPanel !== 'ALL') params.panel = selectedPanel;
      if (selectedRisk !== 'ALL') params.risk = selectedRisk;

      const data = await api.getHistory(params);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedNode, selectedPanel, selectedRisk, limit]);

  // Chart data formatting
  const chartData = [...historyData].reverse().map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    displacement: item.displacement,
    tilt: item.tilt,
    vibration: item.vibration,
    crack: item.crack_width,
    node: item.node_id
  }));

  const handleExportCSV = () => {
    if (historyData.length === 0) return;
    const headers = ['Timestamp', 'Node ID', 'Panel', 'Tilt (°)', 'Displacement (mm)', 'Vibration (mm/s)', 'Crack Width (mm)', 'Battery (%)', 'Final Risk', 'Trend'];
    const rows = historyData.map((d) => [
      d.timestamp,
      d.node_id,
      d.panel,
      d.tilt,
      d.displacement,
      d.vibration,
      d.crack_width,
      d.battery,
      d.final_risk,
      d.trend
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeoSentinel_Strata_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nodeOptions = Array.from({ length: 28 }, (_, i) => `N${String(i + 1).padStart(2, '0')}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 font-mono flex items-center gap-2">
            <span>HISTORICAL GEOTECHNICAL TELEMETRY</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-sans font-semibold">
              Audit Logs & Analysis
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical deformation measurements, AI anomaly inferences, and time-series kinematics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchHistory}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Node filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Node:</span>
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-2.5 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Nodes</option>
            {nodeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Panel filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Panel:</span>
          <select
            value={selectedPanel}
            onChange={(e) => setSelectedPanel(e.target.value)}
            className="px-2.5 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Panels</option>
            <option value="Panel A">Panel A</option>
            <option value="Panel B">Panel B</option>
            <option value="Panel C">Panel C</option>
            <option value="Panel D">Panel D</option>
          </select>
        </div>

        {/* Risk filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Risk:</span>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-2.5 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Limit */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Records:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={400}>400</option>
          </select>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 font-mono">
            Historical Strata Kinematic Multi-Trend
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {chartData.length} Temporal Data Points
          </span>
        </div>

        <div className="h-[280px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Loading historical timeline...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="displacement" name="Displacement (mm)" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tilt" name="Tilt (°)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="crack" name="Crack Width (mm)" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="glass-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-200">
            Historical Telemetry Logs ({historyData.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            SQLite Database Query Result
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-industrial-900 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Node</th>
                <th className="py-2.5 px-3">Panel</th>
                <th className="py-2.5 px-3">Tilt</th>
                <th className="py-2.5 px-3">Disp</th>
                <th className="py-2.5 px-3">Vib</th>
                <th className="py-2.5 px-3">Crack</th>
                <th className="py-2.5 px-3">Battery</th>
                <th className="py-2.5 px-3">Anomaly</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {historyData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(row.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-cyan-400">
                    {row.node_id}
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-medium">
                    {row.panel}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-200">
                    {row.tilt}°
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-200">
                    {row.displacement} mm
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-300">
                    {row.vibration}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-300">
                    {row.crack_width}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {row.battery}%
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        row.anomaly_detected
                          ? 'bg-red-950 text-red-300 border border-red-500/30'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {row.anomaly_detected ? 'ANOMALY' : 'NORMAL'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <RiskBadge risk={row.final_risk} size="sm" />
                  </td>
                  <td className="py-2 px-3">
                    <TrendBadge trend={row.trend} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
