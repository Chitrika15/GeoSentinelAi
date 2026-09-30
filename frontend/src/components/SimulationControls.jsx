import React, { useState } from 'react';
import { Play, Pause, AlertOctagon, RotateCcw, Activity, Radio } from 'lucide-react';
import { useLive } from '../context/LiveContext';

export const SimulationControls = () => {
  const {
    simulationActive,
    subsidenceActive,
    subsidenceStage,
    startSimulation,
    stopSimulation,
    simulateSubsidence,
    resetSimulation,
    isConnected
  } = useLive();

  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (actionName, actionFn) => {
    try {
      setLoadingAction(actionName);
      await actionFn();
    } finally {
      setTimeout(() => setLoadingAction(null), 400);
    }
  };

  const getStageLabel = (stage) => {
    if (stage <= 0) return 'Dormant Strata';
    if (stage <= 3) return `Stage ${stage}/12: Initial Flexure (Normal → Moderate)`;
    if (stage <= 7) return `Stage ${stage}/12: Overburden Sagging (Moderate → High)`;
    return `Stage ${stage}/12: Strata Caving Shear (High → Critical)`;
  };

  return (
    <div className="glass-panel rounded-xl p-4 md:p-5 border border-slate-700/80 shadow-xl bg-gradient-to-r from-industrial-900/90 via-industrial-850/80 to-industrial-900/90">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className={`w-5 h-5 ${simulationActive ? 'animate-pulse' : 'text-slate-500'}`} />
            {simulationActive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                Geological Simulation Controller
              </h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                  simulationActive
                    ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {simulationActive ? 'STREAM ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Software prototype simulating multi-node ESP32/LoRa underground telemetry
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!simulationActive ? (
            <button
              onClick={() => handleAction('start', startSimulation)}
              disabled={loadingAction === 'start'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-950 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Simulation</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction('stop', stopSimulation)}
              disabled={loadingAction === 'stop'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Simulation</span>
            </button>
          )}

          <button
            onClick={() => handleAction('subsidence', simulateSubsidence)}
            disabled={loadingAction === 'subsidence' || subsidenceActive}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95 ${
              subsidenceActive
                ? 'bg-red-950/60 text-red-300 border border-red-500/50 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-red-950/50 cursor-pointer'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{subsidenceActive ? 'Subsidence Event Active' : 'Simulate Subsidence'}</span>
          </button>

          <button
            onClick={() => handleAction('reset', resetSimulation)}
            disabled={loadingAction === 'reset'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'reset' ? 'animate-spin' : ''}`} />
            <span>Reset Simulation</span>
          </button>
        </div>
      </div>

      {/* Subsidence Progression Bar */}
      {subsidenceActive && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-mono text-red-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>{getStageLabel(subsidenceStage)}</span>
            </span>
            <span className="font-mono text-slate-400">
              Target Cluster: Panel B (N07, N08, N09, N10, N11)
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full transition-all duration-700 rounded-full"
              style={{ width: `${Math.min(100, (subsidenceStage / 12) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationControls;
