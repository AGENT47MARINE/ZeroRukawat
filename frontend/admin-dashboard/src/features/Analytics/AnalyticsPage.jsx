import React from 'react';
import { BarChart3, TrendingUp, Users, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, trend, isPositive, icon: Icon }) => (
  <div className="glass-panel p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-400 mb-1 font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl border ${isPositive ? 'bg-success/10 border-success/20 text-success' : 'bg-risk/10 border-risk/20 text-risk'}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="flex items-center mt-4">
      {isPositive ? <ArrowUpRight size={16} className="text-success mr-1" /> : <ArrowDownRight size={16} className="text-risk mr-1" />}
      <span className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-risk'}`}>{trend}</span>
      <span className="text-sm text-gray-500 ml-2">vs last week</span>
    </div>
  </div>
);

const AnalyticsPage = () => {
  const chartData = [
    { day: 'Mon', active: 85, payout: 10 },
    { day: 'Tue', active: 90, payout: 15 },
    { day: 'Wed', active: 60, payout: 60 },
    { day: 'Thu', active: 95, payout: 5 },
    { day: 'Fri', active: 100, payout: 0 },
    { day: 'Sat', active: 110, payout: 5 },
    { day: 'Sun', active: 105, payout: 8 },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-gray-400 mt-1">High-level financial and risk overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Policies" value="12,482" trend="+12.5%" isPositive={true} icon={Users} />
        <StatCard title="Funds Disbursed" value="₹8.4L" trend="+40.1%" isPositive={false} icon={BarChart3} />
        <StatCard title="Fraud Prevented" value="₹1.2L" trend="+5.2%" isPositive={true} icon={ShieldAlert} />
        <StatCard title="Avg Latency" value="12ms" trend="-2.4%" isPositive={true} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-lg font-bold mb-6">Weekly Disruption vs Active Volume</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="w-full flex-1 flex flex-col justify-end space-y-1 relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-darker border border-white/10 px-2 py-1 rounded text-xs whitespace-nowrap z-10 transition-opacity">
                    Payouts: {d.payout}k
                  </div>
                  <div 
                    className="w-full bg-risk/80 rounded-t-sm transition-all duration-300 group-hover:bg-risk"
                    style={{ height: `${(d.payout / 120) * 100}%` }}
                  ></div>
                  <div 
                    className="w-full bg-primary/40 rounded-t-sm transition-all duration-300 group-hover:bg-primary/60"
                    style={{ height: `${(d.active / 120) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-400 mt-3">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-primary/40 rounded"></div><span className="text-sm text-gray-400">Active Workers</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-risk/80 rounded"></div><span className="text-sm text-gray-400">Disrupted Claims</span></div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6">Risk Composition</h3>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {[
              { label: 'Heavy Rain', val: 65, color: 'bg-primary' },
              { label: 'Heatwave', val: 20, color: 'bg-orange-500' },
              { label: 'Traffic Spike', val: 10, color: 'bg-yellow-500' },
              { label: 'AQI Hazard', val: 5, color: 'bg-gray-500' },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">{r.label}</span>
                  <span className="font-bold">{r.val}%</span>
                </div>
                <div className="w-full h-2 bg-darker rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
