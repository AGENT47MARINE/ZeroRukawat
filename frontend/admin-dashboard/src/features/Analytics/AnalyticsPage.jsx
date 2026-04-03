import React from 'react';
import { BarChart3, TrendingUp, Users, ShieldAlert, ArrowUpRight, ArrowDownRight, DollarSign, Gauge } from 'lucide-react';

const StatCard = ({ title, value, trend, isPositive, icon: Icon, accent }) => (
  <div className="metric-card">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-caption text-txt-tertiary mb-1">{title}</p>
        <h3 className="text-display text-txt-primary">{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
    <div className="divider"></div>
    <div className="flex items-center">
      {isPositive
        ? <ArrowUpRight size={14} className="text-success mr-1" />
        : <ArrowDownRight size={14} className="text-risk mr-1" />
      }
      <span className={`text-caption font-semibold ${isPositive ? 'text-success' : 'text-risk'}`}>{trend}</span>
      <span className="text-caption text-txt-muted ml-2">vs last week</span>
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

  const maxVal = 120;

  const topWorkers = [
    { name: 'Rahul K.', zone: 'Koramangala', payouts: 12, amount: '₹4,200' },
    { name: 'Priya M.', zone: 'Indiranagar', payouts: 8, amount: '₹2,800' },
    { name: 'Samir D.', zone: 'Whitefield', payouts: 6, amount: '₹2,100' },
    { name: 'Anil R.', zone: 'HSR Layout', payouts: 5, amount: '₹1,750' },
    { name: 'Divya S.', zone: 'JP Nagar', payouts: 4, amount: '₹1,400' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-up pb-8">
      <div className="mb-6">
        <h1 className="section-title">Platform Analytics</h1>
        <p className="section-subtitle">High-level financial and risk overview</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Policies" value="12,482" trend="+12.5%" isPositive={true} icon={Users} accent="bg-ai/10 text-ai" />
        <StatCard title="Funds Disbursed" value="₹8.4L" trend="+40.1%" isPositive={false} icon={DollarSign} accent="bg-risk/10 text-risk" />
        <StatCard title="Fraud Prevented" value="₹1.2L" trend="+5.2%" isPositive={true} icon={ShieldAlert} accent="bg-success/10 text-success" />
        <StatCard title="Avg Latency" value="12ms" trend="-2.4%" isPositive={true} icon={Gauge} accent="bg-processing/10 text-processing" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-title text-txt-primary mb-6">Weekly Disruption vs Active Volume</h3>
          <div className="h-56 flex items-end gap-3">
            {chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="w-full flex-1 flex flex-col justify-end gap-0.5 relative">
                  {/* Hover tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-3 border border-bdr px-2.5 py-1 rounded-lg text-xs text-txt-primary whitespace-nowrap z-10 transition-opacity duration-150 shadow-card">
                    {d.payout}k disrupted
                  </div>
                  <div
                    className="w-full bg-risk/60 rounded-t transition-all duration-300 group-hover:bg-risk"
                    style={{ height: `${(d.payout / maxVal) * 100}%`, minHeight: d.payout > 0 ? 4 : 0 }}
                  ></div>
                  <div
                    className="w-full bg-ai/30 rounded-t transition-all duration-300 group-hover:bg-ai/50"
                    style={{ height: `${(d.active / maxVal) * 100}%` }}
                  ></div>
                </div>
                <span className="text-caption text-txt-muted mt-2.5 font-medium">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="divider"></div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-ai/30 rounded"></div><span className="text-caption text-txt-muted">Active Workers</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-risk/60 rounded"></div><span className="text-caption text-txt-muted">Disrupted Claims</span></div>
          </div>
        </div>

        {/* Risk Composition */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-title text-txt-primary mb-6">Risk Composition</h3>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {[
              { label: 'Heavy Rain', val: 65, color: 'bg-ai' },
              { label: 'Heatwave', val: 20, color: 'bg-processing' },
              { label: 'Traffic Spike', val: 10, color: 'bg-risk' },
              { label: 'AQI Hazard', val: 5, color: 'bg-txt-muted' },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-caption text-txt-secondary">{r.label}</span>
                  <span className="text-caption font-bold text-txt-primary">{r.val}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden border border-bdr">
                  <div
                    className={`h-full ${r.color} rounded-full transition-all duration-700`}
                    style={{ width: `${r.val}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Workers Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-bdr">
          <h3 className="text-title text-txt-primary">Top Payout Recipients</h3>
          <p className="text-caption text-txt-muted mt-0.5">Workers with highest claim frequency this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bdr bg-surface-3/30">
                <th className="text-left text-overline text-txt-muted uppercase px-5 py-3 font-semibold">#</th>
                <th className="text-left text-overline text-txt-muted uppercase px-5 py-3 font-semibold">Worker</th>
                <th className="text-left text-overline text-txt-muted uppercase px-5 py-3 font-semibold">Zone</th>
                <th className="text-right text-overline text-txt-muted uppercase px-5 py-3 font-semibold">Payouts</th>
                <th className="text-right text-overline text-txt-muted uppercase px-5 py-3 font-semibold">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {topWorkers.map((w, i) => (
                <tr key={i} className="border-b border-bdr last:border-0 hover:bg-surface-3/30 transition-colors">
                  <td className="px-5 py-3.5 text-caption text-txt-muted">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-3 border border-bdr flex items-center justify-center text-caption font-bold text-txt-secondary">
                        {w.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-txt-primary">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-txt-secondary">{w.zone}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="badge-processing text-xs">{w.payouts}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-success">{w.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
