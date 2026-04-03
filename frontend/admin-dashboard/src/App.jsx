import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldAlert, BarChart3, Settings, Zap, LogOut, Bell, Search, ChevronRight } from 'lucide-react';
import { useStore } from './store/useStore';

import DashboardPage from './features/Dashboard/DashboardPage';
import FraudQueuePage from './features/Fraud/FraudQueuePage';
import DisruptionMapPage from './features/Map/DisruptionMapPage';
import AnalyticsPage from './features/Analytics/AnalyticsPage';
import SettingsPage from './features/Settings/SettingsPage';
import LoginPage from './features/Auth/LoginPage';

/* ─── Sidebar ─── */
const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Command Center', path: '/', icon: LayoutDashboard },
    { name: 'Disruption Map', path: '/map', icon: Activity },
    { name: 'Fraud Queue', path: '/fraud', icon: ShieldAlert },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-[260px] bg-surface-1 border-r border-bdr flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="h-18 px-6 flex items-center gap-3 border-b border-bdr">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ai to-ai-dark flex items-center justify-center shadow-glow-ai">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-lg font-display font-bold text-txt-primary tracking-tight">
          ZeroRukawat
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-overline text-txt-muted uppercase tracking-widest px-3 mb-3">Navigation</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-ai/10 text-ai shadow-inner border border-ai/15'
                  : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-3'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-sm font-medium">{item.name}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-bdr">
        <div className="bg-surface-2 rounded-xl p-3.5 border border-bdr">
          <div className="text-overline text-txt-muted uppercase tracking-widest mb-2">System Status</div>
          <div className="flex items-center gap-2 text-success text-sm font-semibold">
            <span className="pulse-dot pulse-dot-success"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ─── Topbar ─── */
const Topbar = () => {
  const { systemHealth, queueLength, inferenceLatency, slaPercentage, triggerSimulation } = useStore();

  const metrics = [
    { label: 'Health', value: `${systemHealth}%`, color: 'text-success' },
    { label: 'Claim Queue', value: queueLength, color: 'text-txt-primary', alert: queueLength > 200 },
    { label: 'AI Latency', value: `${inferenceLatency}ms`, color: 'text-txt-primary' },
    { label: 'Payout SLA', value: `${slaPercentage}%`, color: 'text-success' },
  ];

  return (
    <header className="h-16 bg-surface-1/80 backdrop-blur-xl border-b border-bdr flex items-center justify-between px-6 z-10 sticky top-0">
      {/* Metric Chips */}
      <div className="flex items-center gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-overline text-txt-muted uppercase">{m.label}</span>
            <span className={`text-title font-bold ${m.color} relative`}>
              {m.value}
              {m.alert && (
                <span className="absolute -top-0.5 -right-2.5 h-2 w-2 rounded-full bg-processing animate-pulse"></span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={triggerSimulation}
          className="btn-danger text-xs px-4 py-2"
        >
          <Zap size={14} />
          <span>Simulate Storm</span>
        </button>

        <button className="btn-icon" title="Notifications">
          <Bell size={16} />
        </button>

        <button
          onClick={() => useStore.getState().logout()}
          className="btn-icon hover:!text-risk hover:!border-risk/30 hover:!bg-risk/10"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

/* ─── App Shell ─── */
function App() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-surface-0">
        <Sidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 relative scroll-smooth">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/map" element={<DisruptionMapPage />} />
              <Route path="/fraud" element={<FraudQueuePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
