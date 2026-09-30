import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const LiveContext = createContext(null);

export const LiveProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [riskZones, setRiskZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [simulationActive, setSimulationActive] = useState(true);
  const [subsidenceActive, setSubsidenceActive] = useState(false);
  const [subsidenceStage, setSubsidenceStage] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [telemetryHistory, setTelemetryHistory] = useState([]); // Ring buffer for live charts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initial data hydration via REST
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, nodesData, alertsData, zonesData] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getNodes().catch(() => []),
        api.getAlerts({ limit: 50 }).catch(() => []),
        api.getRiskZones().catch(() => [])
      ]);

      if (dashData) {
        setDashboardStats(dashData);
        setSimulationActive(dashData.simulation_active);
        setSubsidenceActive(dashData.subsidence_active);
        setSubsidenceStage(dashData.subsidence_stage || 0);
      }
      if (nodesData && nodesData.length > 0) {
        setNodes(nodesData);
        // Compute initial aggregate point for charts
        const avgTilt = nodesData.reduce((acc, n) => acc + (n.tilt || 0), 0) / nodesData.length;
        const avgDisp = nodesData.reduce((acc, n) => acc + (n.displacement || 0), 0) / nodesData.length;
        const avgVib = nodesData.reduce((acc, n) => acc + (n.vibration || 0), 0) / nodesData.length;
        const avgCrack = nodesData.reduce((acc, n) => acc + (n.crack_width || 0), 0) / nodesData.length;
        
        setTelemetryHistory([
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            avgTilt: parseFloat(avgTilt.toFixed(2)),
            avgDisp: parseFloat(avgDisp.toFixed(2)),
            avgVib: parseFloat(avgVib.toFixed(2)),
            avgCrack: parseFloat(avgCrack.toFixed(2)),
          }
        ]);
      }
      if (alertsData) {
        setAlerts(alertsData);
      }
      if (zonesData) {
        setRiskZones(zonesData);
      }
    } catch (err) {
      console.error('Failed to load initial GeoSentinel telemetry:', err);
      setError('Failed to connect to backend service. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket Connection Management
  useEffect(() => {
    fetchInitialData();

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/live';

    const connectWebSocket = () => {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('[GeoSentinel WS] Connected to live telemetry stream.');
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_UPDATE') {
              setLastUpdated(data.timestamp);
              setSimulationActive(data.simulation_active);
              setSubsidenceActive(data.subsidence_active);
              setSubsidenceStage(data.subsidence_stage || 0);

              if (data.nodes && Array.isArray(data.nodes)) {
                setNodes(data.nodes);

                // Calculate mean for multi-parameter trend chart
                const meanTilt = data.nodes.reduce((acc, n) => acc + (n.tilt || 0), 0) / data.nodes.length;
                const meanDisp = data.nodes.reduce((acc, n) => acc + (n.displacement || 0), 0) / data.nodes.length;
                const meanVib = data.nodes.reduce((acc, n) => acc + (n.vibration || 0), 0) / data.nodes.length;
                const meanCrack = data.nodes.reduce((acc, n) => acc + (n.crack_width || 0), 0) / data.nodes.length;

                const timeLabel = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                setTelemetryHistory((prev) => {
                  const updated = [
                    ...prev,
                    {
                      time: timeLabel,
                      avgTilt: parseFloat(meanTilt.toFixed(2)),
                      avgDisp: parseFloat(meanDisp.toFixed(2)),
                      avgVib: parseFloat(meanVib.toFixed(2)),
                      avgCrack: parseFloat(meanCrack.toFixed(2)),
                    }
                  ];
                  return updated.slice(-25); // keep last 25 ticks
                });
              }

              if (data.stats) {
                setDashboardStats((prev) => ({
                  ...(prev || {}),
                  ...data.stats,
                  simulation_active: data.simulation_active,
                  subsidence_active: data.subsidence_active,
                  subsidence_stage: data.subsidence_stage,
                  timestamp: data.timestamp
                }));
              }

              if (data.risk_zones) {
                setRiskZones(data.risk_zones);
              }

              if (data.new_alerts && data.new_alerts.length > 0) {
                setAlerts((prev) => {
                  const combined = [...data.new_alerts, ...prev];
                  // deduplicate by alert_code
                  const seen = new Set();
                  return combined.filter((item) => {
                    const duplicate = seen.has(item.alert_code);
                    seen.add(item.alert_code);
                    return !duplicate;
                  }).slice(0, 100);
                });
              }
            }
          } catch (parseErr) {
            console.warn('Failed to parse WS telemetry message:', parseErr);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          console.warn('[GeoSentinel WS] Disconnected. Reconnecting in 3s...');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = (err) => {
          console.error('[GeoSentinel WS] Socket error:', err);
          socket.close();
        };
      } catch (e) {
        console.error('Failed creating WebSocket:', e);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
      }
    };

    connectWebSocket();

    // Heartbeat ping
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchInitialData]);

  // Simulation Controls
  const handleStartSimulation = async () => {
    try {
      const res = await api.startSimulation();
      setSimulationActive(true);
      return res;
    } catch (err) {
      console.error('Failed to start simulation:', err);
    }
  };

  const handleStopSimulation = async () => {
    try {
      const res = await api.stopSimulation();
      setSimulationActive(false);
      return res;
    } catch (err) {
      console.error('Failed to stop simulation:', err);
    }
  };

  const handleSimulateSubsidence = async () => {
    try {
      const res = await api.simulateSubsidence();
      setSubsidenceActive(true);
      setSimulationActive(true);
      return res;
    } catch (err) {
      console.error('Failed to trigger subsidence simulation:', err);
    }
  };

  const handleResetSimulation = async () => {
    try {
      const res = await api.resetSimulation();
      setSubsidenceActive(false);
      setSubsidenceStage(0);
      fetchInitialData();
      return res;
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a))
      );
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  return (
    <LiveContext.Provider
      value={{
        isConnected,
        nodes,
        dashboardStats,
        riskZones,
        alerts,
        simulationActive,
        subsidenceActive,
        subsidenceStage,
        lastUpdated,
        telemetryHistory,
        loading,
        error,
        refreshData: fetchInitialData,
        startSimulation: handleStartSimulation,
        stopSimulation: handleStopSimulation,
        simulateSubsidence: handleSimulateSubsidence,
        resetSimulation: handleResetSimulation,
        acknowledgeAlert: handleAcknowledgeAlert,
        resolveAlert: handleResolveAlert,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
};

export const useLive = () => {
  const context = useContext(LiveContext);
  if (!context) {
    throw new Error('useLive must be used within a LiveProvider');
  }
  return context;
};

export default LiveContext;
