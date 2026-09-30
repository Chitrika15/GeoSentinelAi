import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const RiskBadge = ({ risk = 'LOW', size = 'md' }) => {
  const normalized = (risk || 'LOW').toUpperCase();

  const styles = {
    LOW: {
      bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
      icon: ShieldCheck,
      label: 'LOW RISK'
    },
    MODERATE: {
      bg: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
      icon: AlertTriangle,
      label: 'MODERATE'
    },
    HIGH: {
      bg: 'bg-orange-950/80 text-orange-400 border-orange-500/40',
      icon: AlertOctagon,
      label: 'HIGH RISK'
    },
    CRITICAL: {
      bg: 'bg-red-950/90 text-red-300 border-red-500/60 shadow-lg shadow-red-950/50 animate-pulse',
      icon: Flame,
      label: 'CRITICAL'
    }
  };

  const current = styles[normalized] || styles.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3 py-1.5 gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-sm ${current.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};

export const TrendBadge = ({ trend = 'STABLE', size = 'sm' }) => {
  const normalized = (trend || 'STABLE').toUpperCase();

  if (normalized === 'RAPIDLY INCREASING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
        <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
        <span>RAPIDLY ACCELERATING</span>
      </span>
    );
  }

  if (normalized === 'INCREASING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>INCREASING</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-400 bg-slate-900/60 border border-slate-700/50 px-2 py-0.5 rounded">
      <Minus className="w-3.5 h-3.5 text-slate-500" />
      <span>STABLE</span>
    </span>
  );
};

export default RiskBadge;
