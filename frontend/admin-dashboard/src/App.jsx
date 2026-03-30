import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, CloudLightning, ShieldAlert,
  CreditCard, BarChart3, Settings, AlertCircle,
  TrendingUp, MapPin, Search, Filter,
  Bell, User, ChevronRight, ArrowUpRight, ArrowDownRight,
  Zap, Shield, Globe, Clock, History, AlertTriangle, Play, CheckCircle, XCircle, SearchIcon, RotateCw, Activity, Layers, Database, Smartphone, Share2, MoreVertical
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Scatter
} from 'recharts';

// --- MOCK DATA ---
const KPI_DATA = [
  { label: 'Total Active Workers', value: '1,247', trend: '+12%', color: 'var(--primary)', icon: Users },
  { label: 'Total Policies Active', value: '1,189', trend: '+8%', color: 'var(--accent-green)', icon: Shield },
  { label: 'Payouts Today', value: '83', subValue: '₹1,84,650', trend: '+15%', color: 'var(--accent-orange)', icon: CreditCard },
  { label: 'Disruptions Active', value: '1', subLabel: 'Mumbai (Andheri)', trend: 'Live', color: 'var(--accent-red)', icon: CloudLightning },
  { label: 'Fraud Flags', value: '4', subLabel: 'Pending Review', trend: '-2', color: 'var(--accent-orange)', icon: ShieldAlert },
  { label: 'SLA Compliance', value: '98.3%', trend: '+0.4%', color: 'var(--accent-green)', icon: Zap },
];

const PAYOUT_FEED = [
  { id: '1', time: '10:05 AM', worker: 'Rahul Sharma', zone: 'Andheri East', type: 'Heavy Rain', amount: '₹2,450', status: 'Paid', tx: 'TX_9481023' },
  { id: '2', time: '10:02 AM', worker: 'Anita Singh', zone: 'Bandra West', type: 'Heavy Rain', amount: '₹1,850', status: 'Validating', tx: null },
  { id: '3', time: '09:58 AM', worker: 'Vikram Joshi', zone: 'Kurla', type: 'Heavy Rain', amount: '₹2,100', status: 'Triggered', tx: null },
  { id: '4', time: '09:55 AM', worker: 'Sanjay Varma', zone: 'Powai', type: 'Heavy Rain', amount: '₹2,450', status: 'Fraud Check', tx: null },
  { id: '5', time: '09:50 AM', worker: 'Deepa Roy', zone: 'Vile Parle', type: 'Heavy Rain', amount: '₹1,950', status: 'Paid', tx: 'TX_9480982' },
];

const REVENUE_DATA = [
  { name: 'Mon', premium: 12000, payout: 8000 },
  { name: 'Tue', premium: 15123, payout: 12450 },
  { name: 'Wed', premium: 14500, payout: 9800 },
  { name: 'Thu', premium: 16200, payout: 15000 },
  { name: 'Fri', premium: 15800, payout: 21000 },
  { name: 'Sat', premium: 18000, payout: 25000 },
  { name: 'Sun', premium: 17000, payout: 19000 },
];

const TIER_DISTRIBUTION = [
  { name: 'Bronze', value: 450, color: '#CD7F32' },
  { name: 'Silver', value: 600, color: '#C0C0C0' },
  { name: 'Gold', value: 197, color: '#FFD700' },
];

const DISRUPTIONS_HISTORY = [
  { id: 'MUM-RAIN-001', type: 'Heavy Rain', city: 'Mumbai', zone: 'Andheri East', started: '10:15 AM', threshold: '15mm/hr', affected: 83, payouts: 72, state: 'Active' },
  { id: 'DEL-HEAT-082', type: 'Extreme Heat', city: 'Delhi', zone: 'Sector 12', started: '11:00 AM', threshold: '43°C', affected: 156, payouts: 142, state: 'Resolved' },
  { id: 'BLR-FOG-023', type: 'Dense Fog', city: 'Bengaluru', zone: 'Whitefield', started: '05:30 AM', threshold: '100m', affected: 45, payouts: 38, state: 'Resolved' },
  { id: 'MUM-RAIN-004', type: 'Heavy Rain', city: 'Mumbai', zone: 'Bandra', started: '09:45 AM', threshold: '15mm/hr', affected: 61, payouts: 55, state: 'Active' },
];

const FRAUD_FLAGS = [
  { id: 'F-001', worker: 'Sanjay Varma', eventId: 'MUM-RAIN-001', layer: 'L1 — GPS Moving', score: 0.85, reason: 'High velocity during rain', time: '10:22 AM' },
  { id: 'F-002', worker: 'Vikram Joshi', eventId: 'MUM-RAIN-001', layer: 'L2 — Delivery Log', score: 0.72, reason: 'Delivery completed after trigger', time: '10:25 AM' },
  { id: 'F-003', worker: 'Anita Singh', eventId: 'MUM-RAIN-004', layer: 'L4 — Duplicate ID', score: 0.95, reason: 'Re-attempted same event', time: '10:30 AM' },
  { id: 'F-004', worker: 'Deepa Roy', eventId: 'MUM-RAIN-001', layer: 'L5 — Anomaly Score', score: 0.78, reason: 'Sudden location jump', time: '10:45 AM' },
];

const FRAUD_DISTRIBUTION = [
  { range: '0.0-0.2', count: 450 },
  { range: '0.2-0.4', count: 320 },
  { range: '0.4-0.6', count: 85 },
  { range: '0.6-0.8', count: 12 },
  { range: '0.8-1.0', count: 5 },
];

const CITY_RISK_INDEX = [
  { city: 'Mumbai', workers: 450, interruptions: 12, totalPayout: '₹12.4L', avgFraud: 0.12, risk: 8.5 },
  { city: 'Delhi', workers: 320, interruptions: 8, totalPayout: '₹8.2L', avgFraud: 0.15, risk: 9.2 },
  { city: 'Bengaluru', workers: 280, interruptions: 4, totalPayout: '₹4.1L', avgFraud: 0.08, risk: 4.5 },
  { city: 'Chennai', workers: 120, interruptions: 2, totalPayout: '₹1.5L', avgFraud: 0.05, risk: 3.1 },
];

// --- MAIN APP ---

const Sidebar = ({ activeTab, setActiveTab }) => {
  const links = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'disruptions', label: 'Disruptions', icon: CloudLightning },
    { id: 'fraud', label: 'Fraud Queue', icon: ShieldAlert },
    { id: 'payouts', label: 'Payouts', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-icon">GS</div>
        <span className="logo-text">GigShield</span>
      </div>
      <nav className="nav-links">
        {links.map((link) => (
          <div key={link.id} className={`nav-link ${activeTab === link.id ? 'active' : ''}`} onClick={() => setActiveTab(link.id)}>
            <link.icon size={20} />
            <span>{link.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <div className="nav-link glass-card" style={{ fontSize: '0.75rem', padding: '10px' }}>
          <Activity size={16} color="var(--accent-green)" />
          <span>System Load: 24%</span>
        </div>
      </div>
    </aside>
  );
};

const Header = ({ title }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
    <h1 style={{ fontSize: '1.75rem' }}>{title}</h1>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div className="card glass-card" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <RotateCw size={14} className="rotate-infinite" style={{ color: 'var(--accent-green)' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Auto-Refreshing (15s)</span>
      </div>
      <div className="nav-link" style={{ padding: '8px' }}><Bell size={20} /></div>
      <div className="nav-link" style={{ padding: '8px' }}><User size={20} /></div>
    </div>
  </header>
);

// --- TAB COMPONENTS ---

const OverviewTab = () => (
  <div className="fade-in">
    <div className="kpi-grid">
      {KPI_DATA.map((kpi, index) => (
        <div key={index} className="card kpi-card fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">{kpi.label}</span>
            <div style={{ color: kpi.color, background: `${kpi.color}15`, padding: 8, borderRadius: 8 }}><kpi.icon size={18} /></div>
          </div>
          <div className="kpi-value">{kpi.value}</div>
          {kpi.subValue && <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: -4 }}>{kpi.subValue}</div>}
          <div className={`kpi-trend ${kpi.trend.startsWith('+') ? 'trend-up' : 'badge-primary'}`}>{kpi.trend}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="card" style={{ minHeight: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Live Disruption Map</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus: Andheri Monitoring Zone</span>
        </div>
        <div style={{ width: '100%', height: '300px', background: '#0a101f', borderRadius: 12, position: 'relative', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={120} color="#1e293b" />
          <div style={{ position: 'absolute', top: '50%', left: '42%' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 15px var(--accent-red)', cursor: 'pointer' }}></div>
            <div className="card glass-card" style={{ position: 'absolute', top: 20, left: 10, width: 150, padding: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Heavy Rain</div>
              <div style={{ fontSize: '0.7rem' }}>Mumbai-Andheri</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>Intensity: 18mm/hr</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Real-time Feed</h3>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PAYOUT_FEED.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'Paid' ? 'var(--accent-green)' : 'var(--primary)', marginTop: 6 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span>{p.worker}</span>
                  <span>{p.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{p.zone} • {p.time}</span>
                  <span className={p.status === 'Paid' ? 'trend-up' : 'badge-primary'}>{p.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const WorkersTab = () => (
  <div className="fade-in">
    <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search by name, worker ID, or Aadhaar..." style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--bg-hover)', border: 'none', borderRadius: 8, color: 'white' }} />
      </div>
      <button className="nav-link glass-card" style={{ gap: 8 }}><Filter size={18} /> Filters</button>
    </div>
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Worker ID</th>
            <th>Name</th>
            <th>Zone</th>
            <th>Tier</th>
            <th>Status</th>
            <th>Weeks Active</th>
            <th>Total Payouts</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {[
            { id: 'GS-BLR-2847', name: 'Rahul Sharma', zone: 'Andheri East', tier: 'Silver', status: 'Active', weeks: 12, total: '₹28,450' },
            { id: 'GS-DEL-1092', name: 'Anita Singh', zone: 'Sector 12', tier: 'Gold', status: 'Active', weeks: 8, total: '₹12,200' },
            { id: 'GS-PUN-3841', name: 'Vikram Joshi', zone: 'Kothrud', tier: 'Bronze', status: 'Inactive', weeks: 2, total: '₹0' },
            { id: 'GS-MUM-4982', name: 'Sanjay Varma', zone: 'Powai', tier: 'Silver', status: 'Warning', weeks: 15, total: '₹42,100' },
          ].map(w => (
            <tr key={w.id}>
              <td style={{ fontWeight: 700 }}>{w.id}</td>
              <td>{w.name}</td>
              <td>{w.zone}</td>
              <td><span style={{ color: w.tier === 'Gold' ? '#FFD700' : 'inherit' }}>{w.tier}</span></td>
              <td><span className={`badge ${w.status === 'Active' ? 'badge-success' : w.status === 'Warning' ? 'badge-warning' : 'badge-danger'}`}>{w.status}</span></td>
              <td>{w.weeks}</td>
              <td style={{ fontWeight: 700 }}>{w.total}</td>
              <td><ChevronRight size={18} style={{ color: 'var(--primary)', cursor: 'pointer' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DisruptionsTab = () => (
  <div className="fade-in">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="card">
        <h3>Manual Override</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Trigger disruption manually for specific zones.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select className="nav-link glass-card" style={{ width: '100%', textAlign: 'left', border: 'none' }}>
            <option>Heavy Rain</option>
            <option>Extreme Heat</option>
            <option>Dense Fog</option>
            <option>Local Bandh</option>
          </select>
          <input type="text" placeholder="City (e.g. Mumbai)" className="nav-link glass-card" style={{ border: 'none', color: 'white' }} />
          <input type="text" placeholder="Zone (e.g. Bandra)" className="nav-link glass-card" style={{ border: 'none', color: 'white' }} />
          <button className="btn nav-link active" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>Trigger Event</button>
        </div>
      </div>
      <div className="card">
        <h3>Active Disruptions</h3>
        <div className="table-container" style={{ marginTop: '1rem', maxHeight: 250 }}>
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Threshold</th>
                <th>Workers</th>
                <th>Initiated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DISRUPTIONS_HISTORY.filter(d => d.state === 'Active').map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700 }}>{d.id}</td>
                  <td>{d.type}</td>
                  <td>{d.zone}</td>
                  <td>{d.threshold}</td>
                  <td>{d.affected}</td>
                  <td>{d.payouts}</td>
                  <td><span className="badge badge-danger">Live</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div className="card">
      <h3>Disruption History Log</h3>
      <div className="table-container" style={{ marginTop: '1rem' }}>
        <table>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Type</th>
              <th>City</th>
              <th>Date</th>
              <th>Workers Affected</th>
              <th>Total Payout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DISRUPTIONS_HISTORY.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.type}</td>
                <td>{d.city}</td>
                <td>Today, {d.started}</td>
                <td>{d.affected}</td>
                <td>₹{d.payouts * 2450}</td>
                <td><span className={`badge ${d.state === 'Active' ? 'badge-danger' : 'badge-success'}`}>{d.state}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const FraudTab = () => (
  <div className="fade-in">
    <div className="kpi-grid">
      {[
        { label: 'Total Flagged Today', val: '12', icon: ShieldAlert, color: 'var(--accent-red)' },
        { label: 'Auto-Resolved', val: '8', icon: CheckCircle, color: 'var(--accent-green)' },
        { label: 'Pending Review', val: '4', icon: History, color: 'var(--accent-orange)' },
        { label: 'High Confidence Fraud', val: '1', icon: AlertTriangle, color: 'var(--accent-red)' },
      ].map((item, i) => (
        <div key={i} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="kpi-label">{item.label}</span>
            <item.icon size={18} style={{ color: item.color }} />
          </div>
          <div className="kpi-value">{item.val}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="card">
        <h3>Fraud Queue</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Level</th>
                <th>Score</th>
                <th>Reason</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {FRAUD_FLAGS.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.worker}</td>
                  <td><span className="badge badge-primary">{f.layer.split(' — ')[0]}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, width: 60 }}>
                        <div style={{ width: `${f.score * 100}%`, height: '100%', background: f.score > 0.8 ? 'var(--accent-red)' : 'var(--accent-orange)', borderRadius: 3 }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{f.score}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{f.reason}</td>
                  <td style={{ fontSize: '0.8rem' }}>{f.time}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <CheckCircle size={16} color="var(--accent-green)" style={{ cursor: 'pointer' }} />
                      <XCircle size={16} color="var(--accent-red)" style={{ cursor: 'pointer' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Score Distribution</h3>
        <div style={{ height: 250, marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={FRAUD_DISTRIBUTION}>
              <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                {FRAUD_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.range === '0.8-1.0' ? 'var(--accent-red)' : 'var(--primary)'} />
                ))}
              </Bar>
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 20, paddingTop: 15 }}>
          <h4 style={{ fontSize: '0.8rem' }}>Suspicious Re-attempts</h4>
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            GS-MUM-4982 attempted re-claim for MUM-RAIN-001 at 10:45 AM. <b>Auto-Rejected.</b>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PayoutsTab = () => (
  <div className="fade-in">
    <div className="kpi-grid">
      {[
        { label: 'Total Paid Today', val: '₹1,84,650', icon: CreditCard, color: 'var(--accent-green)' },
        { label: 'Total Paid This Week', val: '₹12,42,800', icon: TrendingUp, color: 'var(--primary)' },
        { label: 'Avg Payout Time', val: '8.4 min', icon: Clock, color: 'var(--accent-green)' },
        { label: 'SLA Compliance', val: '98.3%', icon: Zap, color: 'var(--accent-green)' },
      ].map((item, i) => (
        <div key={i} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="kpi-label">{item.label}</span>
            <item.icon size={18} style={{ color: item.color }} />
          </div>
          <div className="kpi-value">{item.val}</div>
        </div>
      ))}
    </div>

    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3>Payout Timeline (24h)</h3>
      <div style={{ height: 250, marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Area type="monotone" dataKey="payout" stroke="var(--accent-red)" fill="rgba(244, 63, 94, 0.1)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="card">
        <h3>Tier-wise Breakdown</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={TIER_DISTRIBUTION} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {TIER_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h3>Recent Payouts</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Worker</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUT_FEED.map(p => (
                <tr key={p.id}>
                  <td>{p.time}</td>
                  <td style={{ fontWeight: 600 }}>{p.worker}</td>
                  <td>{p.amount}</td>
                  <td><span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-primary'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsTab = () => (
  <div className="fade-in">
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="card">
        <h3>City-wise Risk Index</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>City</th>
                <th>Workers</th>
                <th>Disruptions</th>
                <th>Avg Fraud</th>
                <th>Risk Index</th>
              </tr>
            </thead>
            <tbody>
              {CITY_RISK_INDEX.map(c => (
                <tr key={c.city}>
                  <td style={{ fontWeight: 700 }}>{c.city}</td>
                  <td>{c.workers}</td>
                  <td>{c.interruptions}</td>
                  <td>{c.avgFraud}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3 }}>
                        <div style={{ width: `${c.risk * 10}%`, height: '100%', background: c.risk > 7 ? 'var(--accent-red)' : 'var(--accent-green)', borderRadius: 3 }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{c.risk}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Disruption Frequency</h3>
        <div style={{ height: 250, marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { type: 'Rain', count: 42 },
              { type: 'Heat', count: 12 },
              { type: 'Fog', count: 8 },
              { type: 'AQI', count: 18 },
              { type: 'Bandh', count: 4 }
            ]}>
              <XAxis dataKey="type" stroke="#94a3b8" />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="card">
      <h3>ML Model Performance</h3>
      <div className="kpi-grid" style={{ marginTop: '1.5rem' }}>
        {[
          { label: 'Risk Scorer Accuracy', val: '94.2%', icon: Activity },
          { label: 'Fraud Precision', val: '98.1%', icon: Shield },
          { label: 'Disruption Recall', val: '92.5%', icon: CloudLightning },
          { label: 'Income MAE', val: '₹142', icon: TrendingUp },
        ].map((m, i) => (
          <div key={i} className="glass-card card" style={{ padding: 15 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{m.label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{m.val}</span>
              <m.icon size={20} color="var(--primary)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="fade-in">
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div className="card">
        <h3>Trigger Thresholds</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Disruption Type</th>
                <th>Current Threshold</th>
                <th>Unit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Heavy Rain', val: 15, unit: 'mm/hr' },
                { type: 'Extreme Heat', val: 43, unit: '°C' },
                { type: 'Dense Fog', val: 100, unit: 'metres' },
                { type: 'Severe AQI', val: 300, unit: 'AQI' },
              ].map(t => (
                <tr key={t.type}>
                  <td style={{ fontWeight: 600 }}>{t.type}</td>
                  <td><input type="number" defaultValue={t.val} style={{ width: 60, padding: 4, background: 'var(--bg-hover)', border: 'none', borderRadius: 4, color: 'white' }} /></td>
                  <td>{t.unit}</td>
                  <td><button className="badge badge-primary" style={{ border: 'none', cursor: 'pointer' }}>Update</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 20 }}>Tier Configuration</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Premium</th>
                <th>Max Payout</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Bronze', prem: '₹49', pay: '₹2,450' },
                { name: 'Silver', prem: '₹79', pay: '₹3,850' },
                { name: 'Gold', prem: '₹99', pay: '₹6,300' },
              ].map(tier => (
                <tr key={tier.name}>
                  <td style={{ fontWeight: 600 }}>{tier.name}</td>
                  <td>{tier.prem}/wk</td>
                  <td>{tier.pay}/wk</td>
                  <td><button className="badge badge-primary" style={{ border: 'none' }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Integration Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: '1rem' }}>
          {[
            { name: 'OpenWeatherMap', status: 'Live' },
            { name: 'Google Maps Traffic', status: 'Live' },
            { name: 'Razorpay Sandbox', status: 'Mock' },
            { name: 'Amazon Delivery API', status: 'Live' },
            { name: 'Flipkart Logistics', status: 'Mock' },
            { name: 'Aadhaar DigiLocker', status: 'Live' },
          ].map(api => (
            <div key={api.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>{api.name}</span>
              <span className={`badge ${api.status === 'Live' ? 'badge-success' : 'badge-warning'}`}>{api.status}</span>
            </div>
          ))}
        </div>
        <div className="card glass-card" style={{ marginTop: 25, padding: 15 }}>
          <h4 style={{ fontSize: '0.8rem', marginBottom: 10 }}>Fraud Threshold</h4>
          <input type="range" style={{ width: '100%' }} defaultValue={0.7} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
            <span>0.0 (Relaxed)</span>
            <span>0.7 (Strict)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'workers': return <WorkersTab />;
      case 'disruptions': return <DisruptionsTab />;
      case 'fraud': return <FraudTab />;
      case 'payouts': return <PayoutsTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <Header title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')} />
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
