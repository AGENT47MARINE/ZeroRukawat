import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ShieldAlert, BarChart3, Settings, Zap } from 'lucide-react';
import { useStore } from './store/useStore';

// Dummy imports for now - we will build these next
import DashboardPage from './features/Dashboard/DashboardPage';
import FraudQueuePage from './features/Fraud/FraudQueuePage';
import DisruptionMapPage from './features/Map/DisruptionMapPage';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Command Center', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Disruption Map', path: '/map', icon: <Activity size={20} /> },
    { name: 'Fraud Queue', path: '/fraud', icon: <ShieldAlert size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-card border-r border-white/5 flex flex-col h-screen">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-success to-ai flex items-center justify-center shadow-lg shadow-success/20">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          GigShield
        </span>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-ai/10 text-ai border border-ai/20 shadow-inner' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6">
        <div className="bg-darker rounded-xl p-4 border border-white/5 flex flex-col items-center">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">System Status</div>
          <div className="flex items-center space-x-2 text-success font-semibold">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Topbar = () => {
  const { systemHealth, queueLength, inferenceLatency, slaPercentage, triggerSimulation } = useStore();
  
  return (
    <header className="h-20 bg-card/50 backdrop-blur border-b border-white/5 flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex space-x-8">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Health</span>
          <span className="text-xl font-bold text-success">{systemHealth}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Claim Queue</span>
          <span className="text-xl font-bold text-white group relative">
            {queueLength}
            {queueLength > 200 && (
              <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-processing animate-pulse"></span>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">AI Latency</span>
          <span className="text-xl font-bold text-white">{inferenceLatency}ms</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Payout SLA (&lt;15m)</span>
          <span className="text-xl font-bold text-success">{slaPercentage}%</span>
        </div>
      </div>
      
      <div>
        <button 
          onClick={triggerSimulation}
          className="px-6 py-2.5 bg-risk/10 text-risk border border-risk/30 rounded-full font-semibold text-sm transition-all hover:bg-risk hover:text-white hover:shadow-lg hover:shadow-risk/30 flex items-center space-x-2 hover-lift"
        >
          <Zap size={16} />
          <span>Simulate Storm Spike</span>
        </button>
      </div>
    </header>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-darker">
        <Sidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/map" element={<DisruptionMapPage />} />
              <Route path="/fraud" element={<FraudQueuePage />} />
              <Route path="/analytics" element={<div className="text-white p-10"><h2 className="text-2xl font-bold">Analytics Panel</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>} />
              <Route path="/settings" element={<div className="text-white p-10"><h2 className="text-2xl font-bold">System Configuration</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
