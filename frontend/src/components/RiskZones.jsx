import React from 'react';
import { AlertCircle, MapPin, Radio, ShieldAlert } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

export const RiskZones = ({ zones = [] }) => {
  if (!zones || zones.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-5 border border-slate-800 text-center">
        <div className="flex flex-col items-center justify-center py-6 text-slate-500">
          <ShieldAlert className="w-10 h-10 mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">No Active Geological Risk Zones</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Strata deformation across all panels remains within normal baseline tolerances.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mandatory Engineering Disclaimer */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-industrial-950/80 border border-amber-500/30 text-amber-300 text-xs">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p className="text-[11px] leading-relaxed">
          <strong className="font-semibold text-amber-200">Engineering Notice:</strong> AI-generated prototype risk zones. Derived from multi-node spatial correlation. Not official statutory geotechnical safety boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {zones.map((zone) => {
          const isCritical = zone.severity === 'CRITICAL';
          return (
            <div
              key={zone.zone_id}
              className={`glass-panel rounded-xl p-4 border transition-all ${
                isCritical
                  ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-950/40'
                  : 'border-orange-500/40 bg-orange-950/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-100">
                    {zone.zone_id}
                  </span>
                  <RiskBadge risk={zone.severity} size="sm" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Risk Score: {zone.risk_score}/100
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[11px]">
                  Centroid: {zone.center_latitude.toFixed(5)}°N, {zone.center_longitude.toFixed(5)}°E
                </span>
              </div>

              <div className="border-t border-slate-800/80 pt-2">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Affected Geotechnical Nodes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {zone.affected_nodes.map((nodeId) => (
                    <span
                      key={nodeId}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-industrial-950 border border-slate-700 text-cyan-300"
                    >
                      {nodeId}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskZones;
