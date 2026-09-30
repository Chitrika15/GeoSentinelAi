import React, { useState, useMemo } from 'react';
import { Search, Filter, Battery, ChevronRight, ArrowUpDown } from 'lucide-react';
import { RiskBadge, TrendBadge } from './RiskBadge';

export const SensorTable = ({ nodes = [], onSelectNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPanel, setSelectedPanel] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortField, setSortField] = useState('node_id');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredNodes = useMemo(() => {
    return nodes
      .filter((n) => {
        const matchesSearch =
          n.node_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.panel.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPanel = selectedPanel === 'ALL' || n.panel === selectedPanel;
        const matchesRisk = selectedRisk === 'ALL' || (n.current_risk || 'LOW') === selectedRisk;
        const matchesStatus = selectedStatus === 'ALL' || n.status === selectedStatus;
        return matchesSearch && matchesPanel && matchesRisk && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [nodes, searchTerm, selectedPanel, selectedRisk, selectedStatus, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Filters & Search Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search node ID or panel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-industrial-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Panel */}
          <select
            value={selectedPanel}
            onChange={(e) => setSelectedPanel(e.target.value)}
            className="px-3 py-2 bg-industrial-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Panels</option>
            <option value="Panel A">Panel A</option>
            <option value="Panel B">Panel B</option>
            <option value="Panel C">Panel C</option>
            <option value="Panel D">Panel D</option>
          </select>

          {/* Risk */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 bg-industrial-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-industrial-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Sensor Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-industrial-900/90 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
              <th
                onClick={() => handleSort('node_id')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Node</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Panel</th>
              <th
                onClick={() => handleSort('tilt')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Tilt (°)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('displacement')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Disp (mm)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Vib (mm/s)</th>
              <th className="py-3 px-3">Crack (mm)</th>
              <th className="py-3 px-3">Battery</th>
              <th className="py-3 px-3">Risk Level</th>
              <th className="py-3 px-3">Kinematic Trend</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs">
            {filteredNodes.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-8 text-center text-slate-500">
                  No sensor nodes match the filter criteria.
                </td>
              </tr>
            ) : (
              filteredNodes.map((node) => {
                const isCritical = (node.current_risk || 'LOW') === 'CRITICAL';
                return (
                  <tr
                    key={node.node_id}
                    onClick={() => onSelectNode && onSelectNode(node)}
                    className={`transition-colors cursor-pointer group ${
                      isCritical
                        ? 'bg-red-950/20 hover:bg-red-950/30'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                      {node.node_id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300">
                      {node.panel}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200 font-semibold">
                      {node.tilt}°
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200 font-semibold">
                      {node.displacement}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {node.vibration}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {node.crack_width}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <Battery className={`w-3.5 h-3.5 ${node.battery < 25 ? 'text-red-400' : 'text-emerald-400'}`} />
                        <span>{node.battery}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge risk={node.current_risk} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <TrendBadge trend={node.trend} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{node.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectNode) onSelectNode(node);
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-industrial-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Showing {filteredNodes.length} of {nodes.length} nodes</span>
        <span>Click any sensor row to inspect AI predictions and historical telemetry</span>
      </div>
    </div>
  );
};

export default SensorTable;
