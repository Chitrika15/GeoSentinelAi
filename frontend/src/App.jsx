import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import MineMapPage from './pages/MineMapPage';
import AIPrediction from './pages/AIPrediction';
import Alerts from './pages/Alerts';
import History from './pages/History';
import SystemHealth from './pages/SystemHealth';

export const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-industrial-950 text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col transition-all duration-300">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/map" element={<MineMapPage />} />
            <Route path="/ai-prediction" element={<AIPrediction />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/history" element={<History />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-industrial-900/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              GEOSENTINEL AI • SMART AUTOMATION IN MINING • SIH 2026 (PS ID: SIH26025)
            </span>
            <span className="text-[11px] text-slate-500">
              Department: Coal India Limited • Software & Hardware Early Warning Prototype
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
