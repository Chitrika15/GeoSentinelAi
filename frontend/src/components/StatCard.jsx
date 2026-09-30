import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan', // cyan, emerald, amber, orange, red, slate
  badge
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-cyan-950/20',
      accent: 'text-cyan-400'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-emerald-950/20',
      accent: 'text-emerald-400'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-amber-950/20',
      accent: 'text-amber-400'
    },
    orange: {
      border: 'border-orange-500/20 hover:border-orange-500/50',
      iconBg: 'bg-orange-500/10 text-orange-400',
      glow: 'shadow-orange-950/20',
      accent: 'text-orange-400'
    },
    red: {
      border: 'border-red-500/30 hover:border-red-500/60',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'shadow-red-950/40',
      accent: 'text-red-400'
    },
    slate: {
      border: 'border-slate-700/50 hover:border-slate-600',
      iconBg: 'bg-slate-800 text-slate-300',
      glow: 'shadow-slate-950/20',
      accent: 'text-slate-300'
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div
      className={`glass-panel relative overflow-hidden rounded-xl p-4 md:p-5 transition-all duration-300 hover:shadow-lg ${scheme.border} ${scheme.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-100">
          {value !== undefined && value !== null ? value : '--'}
        </div>
        {badge && (
          <div className="ml-2">
            {badge}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
          <span>{subtitle}</span>
          {trend && <span className="font-medium text-slate-300">{trend}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
