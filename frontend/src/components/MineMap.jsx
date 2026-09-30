import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RiskBadge, TrendBadge } from './RiskBadge';
import { Battery, Zap, AlertTriangle } from 'lucide-react';

// Custom Map center updater component
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Create custom DOM Marker using Leaflet DivIcon
const createCustomMarker = (node) => {
  const risk = (node.current_risk || 'LOW').toUpperCase();
  const colors = {
    LOW: { pin: '#10b981', ring: 'rgba(16, 185, 129, 0.4)' },
    MODERATE: { pin: '#f59e0b', ring: 'rgba(245, 158, 11, 0.4)' },
    HIGH: { pin: '#f97316', ring: 'rgba(249, 115, 22, 0.5)' },
    CRITICAL: { pin: '#ef4444', ring: 'rgba(239, 68, 68, 0.7)' }
  };
  const c = colors[risk] || colors.LOW;

  const html = `
    <div class="sensor-marker">
      <div class="marker-pulse" style="background-color: ${c.ring};"></div>
      <div class="marker-pin" style="background-color: ${c.pin};">
        ${node.node_id.replace('N', '')}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

export const MineMap = ({
  nodes = [],
  riskZones = [],
  onSelectNode,
  selectedNodeId,
  height = '500px',
  center = [23.755, 86.425],
  zoom = 15
}) => {
  const defaultCenter = nodes.length > 0 ? [nodes[0].latitude, nodes[0].longitude] : center;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapRecenter center={defaultCenter} />

        {/* Dark CartoDB tiles suitable for industrial telemetry */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* AI-Generated Risk Zone Circles */}
        {riskZones.map((zone) => {
          const isCritical = zone.severity === 'CRITICAL';
          const color = isCritical ? '#ef4444' : '#f97316';
          return (
            <Circle
              key={zone.zone_id}
              center={[zone.center_latitude, zone.center_longitude]}
              radius={240}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: isCritical ? 0.35 : 0.22,
                weight: 2,
                dashArray: '6, 6'
              }}
            >
              <Popup>
                <div className="p-1 space-y-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-mono font-bold text-xs text-white">{zone.zone_id}</span>
                    <RiskBadge risk={zone.severity} size="sm" />
                  </div>
                  <p className="text-[11px] text-amber-300 font-medium">
                    AI-Generated Risk Zone
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Affected Nodes: {zone.affected_nodes.join(', ')}
                  </p>
                  <span className="text-[9px] text-slate-500 block italic">
                    Not official engineering safety boundary.
                  </span>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Sensor Node Markers */}
        {nodes.map((node) => (
          <Marker
            key={node.node_id}
            position={[node.latitude, node.longitude]}
            icon={createCustomMarker(node)}
            eventHandlers={{
              click: () => {
                if (onSelectNode) onSelectNode(node);
              }
            }}
          >
            <Popup>
              <div className="p-2 min-w-[230px] font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-cyan-400">
                      {node.node_id}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {node.panel}
                    </span>
                  </div>
                  <RiskBadge risk={node.current_risk} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tilt</span>
                    <span className="font-mono font-bold text-slate-100">{node.tilt}°</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Displacement</span>
                    <span className="font-mono font-bold text-slate-100">{node.displacement} mm</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Vibration</span>
                    <span className="font-mono font-bold text-slate-100">{node.vibration} mm/s</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Crack Width</span>
                    <span className="font-mono font-bold text-slate-100">{node.crack_width} mm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{node.battery}%</span>
                  </span>
                  <TrendBadge trend={node.trend} size="sm" />
                </div>

                {onSelectNode && (
                  <button
                    onClick={() => onSelectNode(node)}
                    className="w-full mt-2 py-1 px-2 text-center text-xs font-semibold rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 transition-colors"
                  >
                    View Complete Telemetry
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-4 right-4 z-20 glass-panel p-3 rounded-lg border border-slate-700/80 text-xs shadow-xl pointer-events-auto">
        <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-300 block mb-2">
          Strata Severity
        </span>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300 text-[11px]">Low (&lt; 1.5°, &lt; 8mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-300 text-[11px]">Moderate (Roof Sag)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            <span className="text-slate-300 text-[11px]">High (Shear Strain)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
            <span className="text-slate-300 text-[11px]">Critical (Caving Void)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MineMap;
