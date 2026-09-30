import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Map,
  Cpu,
  Bell,
  History,
  HeartPulse,
  Radio,
  Layers,
  X
} from 'lucide-react';
import { useLive } from '../context/LiveContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { dashboardStats, isConnected } = useLive();
  const alertCount = dashboardStats?.active_alerts_count || 0;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live Monitoring', icon: Activity },
    { to: '/map', label: 'Mine Map', icon: Map },
    { to: '/ai-prediction', label: 'AI Prediction', icon: Cpu },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: alertCount },
    { to: '/history', label: 'History', icon: History },
    { to: '/system-health', label: 'System Health', icon: HeartPulse },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-industrial-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-950/60 flex items-center justify-center">
              <div className="w-full h-full bg-industrial-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider text-slate-100 font-mono">
                GEOSENTINEL <span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Mine Strata Early Warning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SIH / Coal India Callout */}
        <div className="mx-4 mt-4 p-3 rounded-lg bg-industrial-950/80 border border-slate-800/80 text-[11px]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-cyan-400">SIH 2026: PS SIH26025</span>
            <span className="text-[10px] text-slate-500">CIL Theme</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-tight">
            Coal India Limited • Real-Time Subsidence Kinematics Monitoring
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-red-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Stream Status */}
        <div className="p-4 border-t border-slate-800 bg-industrial-950/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              </span>
              <span className="text-slate-400 text-[11px]">
                {isConnected ? 'Telemetry Stream Live' : 'Reconnecting WS...'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
