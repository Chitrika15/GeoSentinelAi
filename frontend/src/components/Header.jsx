import React, { useState, useEffect } from 'react';
import { Menu, ShieldAlert, Wifi, WifiOff, Clock, RefreshCw } from 'lucide-react';
import { useLive } from '../context/LiveContext';
import { RiskBadge } from './RiskBadge';

export const Header = ({ onOpenSidebar }) => {
  const { dashboardStats, isConnected, refreshData, simulationActive } = useLive();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const overallRisk = dashboardStats?.overall_risk || 'LOW';

  return (
    <header className="sticky top-0 z-30 h-16 bg-industrial-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between">
      {/* Mobile menu button & page title context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Coalfield Block:
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              Jharia Basin Pit-04
            </span>
          </div>
        </div>
      </div>

      {/* Center / Right stats indicators */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Overall Strata Risk */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-industrial-950/70 border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 hidden sm:inline">
            Strata Risk:
          </span>
          <RiskBadge risk={overallRisk} size="sm" />
        </div>

        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs font-mono bg-industrial-950/70 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* WebSocket connectivity status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
            isConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
              : 'bg-red-950/40 text-red-400 border-red-500/30'
          }`}
          title={isConnected ? 'WebSocket Telemetry Connected' : 'WebSocket Disconnected'}
        >
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Manual Refresh */}
        <button
          onClick={refreshData}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
