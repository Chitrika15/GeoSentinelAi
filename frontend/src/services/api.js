import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // System Health
  getHealth: async () => {
    const res = await client.get('/api/health');
    return res.data;
  },
  getSystemHealth: async () => {
    const res = await client.get('/api/system-health');
    return res.data;
  },

  // Dashboard Summary
  getDashboard: async () => {
    const res = await client.get('/api/dashboard');
    return res.data;
  },

  // Sensor Nodes
  getNodes: async (params = {}) => {
    const res = await client.get('/api/nodes', { params });
    return res.data;
  },
  getNode: async (nodeId) => {
    const res = await client.get(`/api/nodes/${nodeId}`);
    return res.data;
  },

  // Telemetry Readings
  getReadings: async (params = {}) => {
    const res = await client.get('/api/readings', { params });
    return res.data;
  },
  getNodeReadings: async (nodeId, limit = 40) => {
    const res = await client.get(`/api/readings/${nodeId}`, { params: { limit } });
    return res.data;
  },

  // Historical Telemetry and Logs
  getHistory: async (params = {}) => {
    const res = await client.get('/api/history', { params });
    return res.data;
  },

  // Predictions & Inferences
  getPredictions: async (limit = 50) => {
    const res = await client.get('/api/predictions', { params: { limit } });
    return res.data;
  },
  getNodePredictions: async (nodeId, limit = 30) => {
    const res = await client.get(`/api/predictions/${nodeId}`, { params: { limit } });
    return res.data;
  },

  // Spatial Risk Zones
  getRiskZones: async () => {
    const res = await client.get('/api/risk-zones');
    return res.data;
  },

  // ML Diagnostics & Model Performance
  getMLMetrics: async () => {
    const res = await client.get('/api/ml/metrics');
    return res.data;
  },

  // Alerts Management
  getAlerts: async (params = {}) => {
    const res = await client.get('/api/alerts', { params });
    return res.data;
  },
  acknowledgeAlert: async (alertId) => {
    const res = await client.post(`/api/alerts/${alertId}/acknowledge`);
    return res.data;
  },
  resolveAlert: async (alertId) => {
    const res = await client.post(`/api/alerts/${alertId}/resolve`);
    return res.data;
  },

  // Simulation Orchestration
  startSimulation: async () => {
    const res = await client.post('/api/simulation/start');
    return res.data;
  },
  stopSimulation: async () => {
    const res = await client.post('/api/simulation/stop');
    return res.data;
  },
  simulateSubsidence: async () => {
    const res = await client.post('/api/simulation/subsidence');
    return res.data;
  },
  resetSimulation: async () => {
    const res = await client.post('/api/simulation/reset');
    return res.data;
  },
};

export default api;
