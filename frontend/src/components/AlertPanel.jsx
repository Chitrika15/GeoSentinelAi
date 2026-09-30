import React, { useState } from 'react';
import { Bell, CheckCircle2, CheckSquare, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RiskBadge, TrendBadge } from './RiskBadge';
import { useLive } from '../context/LiveContext';

export const AlertPanel = ({
  alerts = [],
  title = "Geotechnical Early Warnings & Subsidence Alerts",
  compact = false,
  showActions = true
}) => {
  const { acknowledgeAlert, resolveAlert } = useLive();
  const [actingId, setActingId] = useState(null);

  const handleAcknowledge = async (id) => {
    try {
      setActingId(id);
      await acknowledgeAlert(id);
    } finally {
      setActingId(null);
    }
  };

  const handleResolve = async (id) => {
    try {
      setActingId(id);
      await resolveAlert(id);
    } finally {
      setActingId(null);
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-5 border border-slate-800 text-center">
        <div className="flex flex-col items-center justify-center py-6 text-slate-500">
          <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500/60" />
          <p className="text-sm font-medium text-slate-200">No Active Strata Alerts</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Strata displacement velocities and crack growth rates remain within normal safety thresholds.
          </p>
        </div>
      </div>
    );
  }

  const displayedAlerts = compact ? alerts.slice(0, 5) : alerts;

  return (
    <div className="glass-panel rounded-xl p-4 md:p-5 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-red-400 animate-pulse" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            {title}
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/30">
          {alerts.filter(a => a.status === 'ACTIVE').length} Active
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
        {displayedAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isActive = alert.status === 'ACTIVE';
          const isAcknowledged = alert.status === 'ACKNOWLEDGED';

          return (
            <div
              key={alert.id || alert.alert_code}
              className={`p-3.5 rounded-lg border transition-all ${
                isCritical && isActive
                  ? 'bg-red-950/25 border-red-500/50 shadow-md shadow-red-950/30'
                  : isAcknowledged
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : 'bg-industrial-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-100">
                    {alert.alert_code || `ALT-${alert.node_id}`}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                    {alert.node_id} ({alert.panel})
                  </span>
                  <RiskBadge risk={alert.severity} size="sm" />
                  <TrendBadge trend={alert.trend} size="sm" />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {alert.message}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Status:</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-red-950 text-red-300 border border-red-500/40'
                        : isAcknowledged
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {alert.status}
                  </span>
                  {alert.risk_probability > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Certainty: {(alert.risk_probability * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {showActions && (
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={actingId === alert.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition-colors"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={actingId === alert.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertPanel;
