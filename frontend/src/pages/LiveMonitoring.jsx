import React, { useState } from 'react';
import { Activity, Radio, RefreshCw } from 'lucide-react';
import { useLive } from '../context/LiveContext';
import SensorTable from '../components/SensorTable';
import SensorDetails from '../components/SensorDetails';
import LoadingState from '../components/LoadingState';

export const LiveMonitoring = () => {
  const { nodes, loading, refreshData, simulationActive } = useLive();
  const [selectedNode, setSelectedNode] = useState(null);

  if (loading && nodes.length === 0) {
    return <LoadingState message="Connecting to live sensor telemetry network..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 font-mono flex items-center gap-2">
            <span>LIVE STRATA TELEMETRY MONITORING</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-sans font-semibold">
              28 Distributed Nodes
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-sensor telemetry stream from underground coal mining panels (Panel A, B, C, D)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-industrial-900 border border-slate-800 text-xs">
            <Radio className={`w-3.5 h-3.5 ${simulationActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-300 font-mono">
              {simulationActive ? 'TELEMETRY LIVE' : 'STREAM PAUSED'}
            </span>
          </div>

          <button
            onClick={refreshData}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sensor Table */}
      <SensorTable
        nodes={nodes}
        onSelectNode={(node) => setSelectedNode(node)}
      />

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

export default LiveMonitoring;
