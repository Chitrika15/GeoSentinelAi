import React, { useState } from 'react';
import { Bell, Filter, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { useLive } from '../context/LiveContext';
import AlertPanel from '../components/AlertPanel';

export const Alerts = () => {
  const { alerts, refreshData } = useLive();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filteredAlerts = alerts.filter((a) => {
    const sMatch = statusFilter === 'ALL' || a.status === statusFilter;
    const sevMatch = severityFilter === 'ALL' || a.severity === severityFilter;
    return sMatch && sevMatch;
  });

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const ackCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 font-mono flex items-center gap-2">
            <span>GEOTECHNICAL HAZARD ALERTS</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/40 font-sans font-semibold">
              Early Warning Feed
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts dispatched upon AI model detection of HIGH shear strain or CRITICAL void formation
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active ({activeCount})</option>
            <option value="ACKNOWLEDGED">Acknowledged ({ackCount})</option>
            <option value="RESOLVED">Resolved ({resolvedCount})</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Risk Only</option>
          </select>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-mono uppercase text-slate-400 block mb-1">Total Warnings</span>
          <span className="text-2xl font-bold font-mono text-slate-100">{alerts.length}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-950/20">
          <span className="text-xs font-mono uppercase text-red-400 block mb-1">Active Alerts</span>
          <span className="text-2xl font-bold font-mono text-red-400">{activeCount}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
          <span className="text-xs font-mono uppercase text-amber-400 block mb-1">Acknowledged</span>
          <span className="text-2xl font-bold font-mono text-amber-400">{ackCount}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <span className="text-xs font-mono uppercase text-emerald-400 block mb-1">Resolved</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{resolvedCount}</span>
        </div>
      </div>

      {/* Main Alert Feed */}
      <AlertPanel
        alerts={filteredAlerts}
        title={`Hazard Warnings Feed (${filteredAlerts.length})`}
        compact={false}
        showActions={true}
      />
    </div>
  );
};

export default Alerts;
