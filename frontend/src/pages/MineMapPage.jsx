import React, { useState } from 'react';
import { Map, Layers, Radio, AlertOctagon, Filter, Eye } from 'lucide-react';
import { useLive } from '../context/LiveContext';
import MineMap from '../components/MineMap';
import RiskZones from '../components/RiskZones';
import SensorDetails from '../components/SensorDetails';
import { RiskBadge } from '../components/RiskBadge';

export const MineMapPage = () => {
  const { nodes, riskZones } = useLive();
  const [selectedNode, setSelectedNode] = useState(null);
  const [panelFilter, setPanelFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredNodes = nodes.filter((n) => {
    const pMatch = panelFilter === 'ALL' || n.panel === panelFilter;
    const rMatch = riskFilter === 'ALL' || (n.current_risk || 'LOW') === riskFilter;
    return pMatch && rMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 font-mono flex items-center gap-2">
            <span>GEOLOGICAL GIS MINE MAP</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-sans font-semibold">
              Spatial Visualization
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Georeferenced sensor node network anchored in Jharia coalfield with dynamic AI prototype risk zones
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
            className="px-3 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Panels (A, B, C, D)</option>
            <option value="Panel A">Panel A</option>
            <option value="Panel B">Panel B</option>
            <option value="Panel C">Panel C</option>
            <option value="Panel D">Panel D</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 bg-industrial-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Main Map Canvas & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Large GIS Map */}
        <div className="lg:col-span-3 space-y-3">
          <div className="glass-panel p-2 rounded-xl border border-slate-800 shadow-2xl">
            <MineMap
              nodes={filteredNodes}
              riskZones={riskZones}
              onSelectNode={(node) => setSelectedNode(node)}
              height="620px"
              zoom={15}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Displaying {filteredNodes.length} geolocated sensors</span>
            <span className="font-mono text-cyan-400">CartoDB Dark Basemap Active</span>
          </div>
        </div>

        {/* Quick Node List & Risk Zones Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Risk Zones Widget */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Active Risk Zones ({riskZones.length})
              </span>
              <AlertOctagon className="w-4 h-4 text-orange-400" />
            </div>
            <RiskZones zones={riskZones} />
          </div>

          {/* Quick Node Selection Panel */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                Sensors ({filteredNodes.length})
              </span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredNodes.map((n) => (
                <div
                  key={n.node_id}
                  onClick={() => setSelectedNode(n)}
                  className="flex items-center justify-between p-2 rounded-lg bg-industrial-900/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-cyan-400">
                      {n.node_id}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {n.panel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-300">
                      {n.displacement}mm
                    </span>
                    <RiskBadge risk={n.current_risk} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Inspector */}
      {selectedNode && (
        <SensorDetails
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default MineMapPage;
