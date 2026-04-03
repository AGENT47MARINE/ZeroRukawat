import React from 'react';
import { ShieldCheck, Clock, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import PipelineViewer from '../../components/PipelineViewer';
import { useStore } from '../../store/useStore';

const DashboardPage = () => {
  const { disruptions, claims } = useStore();

  const metrics = [
    { label: 'Active Disruptions', value: disruptions.length, icon: <AlertTriangle size={24} className="text-processing" />, trend: '+2 since last hour' },
    { label: 'Claims Queued', value: claims.filter(c => c.status !== 'PAID').length, icon: <Clock size={24} className="text-ai" />, trend: 'Processed within 3s' },
    { label: 'Fraud Shield Blocks', value: 43, icon: <ShieldCheck size={24} className="text-risk" />, trend: 'Saving ₹1.2L today' },
    { label: 'Auto-Payouts Today', value: 1240, icon: <Zap size={24} className="text-success" />, trend: '98% automated' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Value Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="glass-panel p-6 hover-lift group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform">
              {m.icon}
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                {m.icon}
              </div>
              <div>
                <h3 className="text-sm text-gray-400 font-medium">{m.label}</h3>
                <div className="text-3xl font-bold mt-1 text-white">{m.value}</div>
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-gray-500 border-t border-white/5 pt-3">
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Claim Processing Pipeline */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Real-Time Claim Pipeline</h2>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ai opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ai"></span>
            </span>
            <span className="text-sm text-ai font-medium">Live Streaming feed</span>
          </div>
        </div>
        
        <PipelineViewer />
      </div>

      {/* Active Monitors */}
      <div className="grid grid-cols-2 gap-8">
        <div className="glass-panel p-6 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-4">Live Disruptions</h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {disruptions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No active disruptions monitored.</div>
            ) : disruptions.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer group">
                <div>
                  <div className="font-semibold text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-processing animate-pulse"></span>
                    <span>{d.location}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Affected: {d.workersAffected} workers • {d.type}</div>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-4">Recent Auto-Payouts</h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {claims.filter(c=>c.status==='PAID').length === 0 && <div className="text-gray-500 text-center mt-10">Awaiting payouts...</div>}
            {claims.filter(c=>c.status==='PAID').slice(0,10).map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-success/5 border-transparent hover:border-success/20 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{p.workerName}</div>
                    <div className="text-xs text-gray-400">Processed in 800ms via UPI</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">+₹{p.amount}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.id.substring(0,8)}</div>
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
