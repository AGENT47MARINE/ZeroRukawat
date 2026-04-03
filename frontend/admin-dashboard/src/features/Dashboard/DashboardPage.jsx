import React from 'react';
import { ShieldCheck, Clock, Zap, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import PipelineViewer from '../../components/PipelineViewer';
import { useStore } from '../../store/useStore';

const MetricCard = ({ label, value, icon: Icon, iconColor, trend }) => (
  <div className="metric-card group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor} bg-current/10`}>
        <Icon size={20} />
      </div>
      <TrendingUp size={14} className="text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <h3 className="text-caption text-txt-tertiary uppercase tracking-wide">{label}</h3>
    <div className="text-display text-txt-primary mt-1">{value}</div>
    <div className="divider"></div>
    <p className="text-caption text-txt-muted">{trend}</p>
  </div>
);

const DashboardPage = () => {
  const { disruptions, claims } = useStore();

  const metrics = [
    { label: 'Active Disruptions', value: disruptions.length, icon: AlertTriangle, iconColor: 'text-processing', trend: '+2 since last hour' },
    { label: 'Claims Queued', value: claims.filter(c => c.status !== 'PAID').length, icon: Clock, iconColor: 'text-ai', trend: 'Processed within 3s' },
    { label: 'Fraud Blocks', value: 43, icon: ShieldCheck, iconColor: 'text-risk', trend: 'Saving ₹1.2L today' },
    { label: 'Auto-Payouts', value: '1,240', icon: Zap, iconColor: 'text-success', trend: '98% automated' }
  ];

  return (
    <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* Pipeline */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="section-title">Real-Time Claim Pipeline</h2>
            <p className="section-subtitle">Live processing status across all stages</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="pulse-dot pulse-dot-ai"></span>
            <span className="text-caption text-ai font-medium">Live Stream</span>
          </div>
        </div>
        <PipelineViewer />
      </div>

      {/* Two-column: Disruptions + Payouts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Disruptions */}
        <div className="glass-panel p-5 flex flex-col" style={{ maxHeight: 420 }}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
            <h2 className="text-title text-txt-primary">Live Disruptions</h2>
            <span className="badge-processing">{disruptions.length} active</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {disruptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-txt-muted py-12">
                <AlertTriangle size={32} className="mb-3 opacity-30" />
                <span className="text-sm">No active disruptions</span>
                <span className="text-xs text-txt-muted mt-1">Click "Simulate Storm" to test</span>
              </div>
            ) : disruptions.map((d) => (
              <div key={d.id} className="list-item group">
                <div className="flex items-center gap-3">
                  <span className="pulse-dot pulse-dot-risk"></span>
                  <div>
                    <div className="text-sm font-semibold text-txt-primary">{d.location}</div>
                    <div className="text-xs text-txt-muted mt-0.5">{d.workersAffected} workers · {d.type.replace('_', ' ')}</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-txt-muted group-hover:text-txt-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="glass-panel p-5 flex flex-col" style={{ maxHeight: 420 }}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-bdr">
            <h2 className="text-title text-txt-primary">Recent Auto-Payouts</h2>
            <span className="badge-success">{claims.filter(c=>c.status==='PAID').length} paid</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {claims.filter(c=>c.status==='PAID').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-txt-muted py-12">
                <Zap size={32} className="mb-3 opacity-30" />
                <span className="text-sm">Awaiting payouts...</span>
                <span className="text-xs text-txt-muted mt-1">Payouts appear here after disruption triggers</span>
              </div>
            ) : claims.filter(c=>c.status==='PAID').slice(0,12).map((p) => (
              <div key={p.id} className="list-item group hover:!border-success/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center text-success">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-txt-primary">{p.workerName}</div>
                    <div className="text-xs text-txt-muted">Processed via UPI · 800ms</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-success">+₹{p.amount}</div>
                  <div className="text-xs text-txt-muted font-mono">{p.id.substring(0,10)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
