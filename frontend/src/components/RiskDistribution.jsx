import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon, Shield } from 'lucide-react';

export const RiskDistribution = ({ stats }) => {
  const normal = stats?.normal_count || 0;
  const moderate = stats?.moderate_count || 0;
  const high = stats?.high_risk_count || 0;
  const critical = stats?.critical_count || 0;
  const total = normal + moderate + high + critical || 28;

  const data = [
    { name: 'Low Risk', value: normal, color: '#10b981' },
    { name: 'Moderate', value: moderate, color: '#f59e0b' },
    { name: 'High Risk', value: high, color: '#f97316' },
    { name: 'Critical', value: critical, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const fallbackData = [{ name: 'Stable Strata', value: 28, color: '#10b981' }];
  const chartData = data.length > 0 ? data : fallbackData;

  return (
    <div className="glass-panel rounded-xl p-4 md:p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Network Risk Distribution
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {total} Active Nodes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
        {/* Donut Chart */}
        <div className="h-[180px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${val} Nodes (${((val / total) * 100).toFixed(0)}%)`, name]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f8fafc'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-slate-100">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Nodes</span>
          </div>
        </div>

        {/* Legend & Percentages */}
        <div className="space-y-2.5">
          {[
            { label: 'Low Risk', count: normal, color: 'bg-emerald-500', text: 'text-emerald-400' },
            { label: 'Moderate', count: moderate, color: 'bg-amber-500', text: 'text-amber-400' },
            { label: 'High Risk', count: high, color: 'bg-orange-500', text: 'text-orange-400' },
            { label: 'Critical', count: critical, color: 'bg-red-500', text: 'text-red-400' },
          ].map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                  <span className="text-slate-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className={`font-bold ${item.text}`}>{item.count}</span>
                  <span className="text-slate-500 text-[10px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-time ML risk stratification</span>
        </span>
        <span className="font-mono text-slate-300">
          Index: {stats?.overall_risk_score || 0}/100
        </span>
      </div>
    </div>
  );
};

export default RiskDistribution;
