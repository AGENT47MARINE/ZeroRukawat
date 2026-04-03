import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CloudLightning,
  ShieldAlert,
  CreditCard,
  BarChart3,
  Settings,
  TrendingUp,
  Search,
  Bell,
  User,
  RotateCw,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  Shield,
  Database,
  Server,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const ADMIN_PHONE_DEFAULT = import.meta.env.VITE_ADMIN_PHONE || '';
const ADMIN_PASSWORD_DEFAULT = import.meta.env.VITE_ADMIN_PASSWORD || '';
const TOKEN_STORAGE_KEY = 'zr_admin_token';
const AUTO_REFRESH_MS = 15000;

const TIER_COLORS = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
};

const DISRUPTION_TYPES = ['Heavy Rain', 'Extreme Heat', 'Dense Fog', 'Local Bandh'];

const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY) || '';
const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));
const formatCurrency = (value) => `INR ${formatNumber(Math.round(Number(value || 0)))}`;
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const getStatusBadgeClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('approve') || value.includes('active') || value.includes('live') || value.includes('healthy') || value.includes('ok')) {
    return 'badge-success';
  }
  if (value.includes('amber') || value.includes('pending') || value.includes('hold') || value.includes('processing') || value.includes('degraded')) {
    return 'badge-warning';
  }
  return 'badge-danger';
};

const toDate = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) {
    return '-';
  }
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) {
    return '-';
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
};

const getBackendRoot = () => API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const requestJson = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.status === 'error') {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
};

const requestHealth = async () => {
  const response = await fetch(`${getBackendRoot()}/health`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  return payload;
};

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
          <Database size={16} color="var(--accent-green)" />
          <span>Live API Mode</span>
        </div>
      </div>
    </aside>
  );
};

const Header = ({ title, loading, onRefresh, onLogout, lastUpdated }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
    <h1 style={{ fontSize: '1.75rem' }}>{title}</h1>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <button className="card glass-card" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', border: 'none', color: 'var(--text-main)' }} onClick={onRefresh}>
        <RotateCw size={14} className={loading ? 'rotate-infinite' : ''} style={{ color: 'var(--accent-green)' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </span>
      </button>
      <div className="card glass-card" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
        Last update: {lastUpdated ? formatDateTime(lastUpdated) : '-'}
      </div>
      <div className="nav-link" style={{ padding: '8px' }}><Bell size={20} /></div>
      <div className="nav-link" style={{ padding: '8px' }}><User size={20} /></div>
      <button className="nav-link" style={{ padding: '8px', border: 'none', background: 'transparent' }} onClick={onLogout} title="Logout">
        <LogOut size={20} />
      </button>
    </div>
  </header>
);

const LoginView = ({ form, setForm, onSubmit, loading, error }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
    <div className="card" style={{ width: '100%', maxWidth: 420 }}>
      <h2 style={{ marginBottom: 12 }}>Admin Sign In</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Connect dashboard to live backend data.
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          placeholder="Admin phone"
          className="nav-link glass-card"
          style={{ border: 'none', color: 'white', width: '100%' }}
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Admin password"
          className="nav-link glass-card"
          style={{ border: 'none', color: 'white', width: '100%' }}
          required
        />
        <button className="nav-link active" style={{ justifyContent: 'center', border: 'none' }} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      {error ? (
        <div className="badge badge-danger" style={{ marginTop: 16, display: 'inline-flex' }}>
          {error}
        </div>
      ) : null}
      <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        API Base URL: {API_BASE_URL}
      </div>
    </div>
  </div>
);

const KpiCard = ({ label, value, subValue, icon: Icon, color = 'var(--primary)' }) => (
  <div className="card kpi-card fade-in">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span className="kpi-label">{label}</span>
      <div style={{ color, background: `${color}20`, padding: 8, borderRadius: 8 }}>
        <Icon size={18} />
      </div>
    </div>
    <div className="kpi-value">{value}</div>
    {subValue ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subValue}</div> : null}
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ padding: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{text}</div>
);

const OverviewTab = ({ kpis, activeDisruptions, recentClaims }) => (
  <div className="fade-in">
    <div className="kpi-grid">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="card" style={{ minHeight: 280 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Active Disruptions</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeDisruptions.length} live</span>
        </div>
        {activeDisruptions.length === 0 ? (
          <EmptyState text="No active disruptions reported by backend." />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {activeDisruptions.slice(0, 6).map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.type}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.zone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="badge badge-danger">Live</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {formatRelativeTime(item.start_time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Recent Claim Feed</h3>
        {recentClaims.length === 0 ? (
          <EmptyState text="No claims available yet." />
        ) : (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentClaims.map((claim) => (
              <div key={claim.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: claim.status === 'Approved' ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: 6 }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>{claim.workerName}</span>
                    <span>{formatCurrency(claim.amount_credited)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{formatRelativeTime(claim.created_at)}</span>
                    <span className={`badge ${getStatusBadgeClass(claim.status)}`}>{claim.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const WorkersTab = ({ workers }) => {
  const [query, setQuery] = useState('');

  const filteredWorkers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return workers;
    }
    return workers.filter((worker) => {
      return [worker.id, worker.name, worker.phone, worker.city, worker.zone].join(' ').toLowerCase().includes(search);
    });
  }, [query, workers]);

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, worker ID, phone, city or zone..."
            style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--bg-hover)', border: 'none', borderRadius: 8, color: 'white' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Worker ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>City</th>
              <th>Zone</th>
              <th>Tier</th>
              <th>Risk Score</th>
              <th>Status</th>
              <th>Weeks Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map((worker) => {
              const created = toDate(worker.created_at);
              const weeksActive = created ? Math.max(0, Math.floor((Date.now() - created.getTime()) / (7 * 24 * 3600 * 1000))) : 0;

              return (
                <tr key={worker.id}>
                  <td style={{ fontWeight: 700 }}>{worker.id}</td>
                  <td>{worker.name}</td>
                  <td>{worker.phone}</td>
                  <td>{worker.city}</td>
                  <td>{worker.zone}</td>
                  <td style={{ color: TIER_COLORS[worker.tier] || 'inherit' }}>{worker.tier}</td>
                  <td>{Number(worker.risk_score || 0).toFixed(2)}</td>
                  <td><span className={`badge ${worker.is_active ? 'badge-success' : 'badge-danger'}`}>{worker.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>{weeksActive}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredWorkers.length === 0 ? <EmptyState text="No workers match the current search." /> : null}
      </div>
    </div>
  );
};

const DisruptionsTab = ({ activeDisruptions, disruptionsHistory, onCreateDisruption, creatingDisruption }) => {
  const [form, setForm] = useState({ type: DISRUPTION_TYPES[0], zone: '', threshold_value: 'Manual' });

  const submitDisruption = async (event) => {
    event.preventDefault();
    await onCreateDisruption(form);
    setForm((prev) => ({ ...prev, zone: '' }));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3>Create Disruption</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            This writes directly to backend endpoint POST /disruptions/.
          </p>
          <form onSubmit={submitDisruption} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="nav-link glass-card"
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white' }}
            >
              {DISRUPTION_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              value={form.zone}
              onChange={(event) => setForm((prev) => ({ ...prev, zone: event.target.value }))}
              placeholder="Zone (example: Mumbai_Andheri)"
              className="nav-link glass-card"
              style={{ border: 'none', color: 'white' }}
              required
            />
            <input
              type="text"
              value={form.threshold_value}
              onChange={(event) => setForm((prev) => ({ ...prev, threshold_value: event.target.value }))}
              placeholder="Threshold value"
              className="nav-link glass-card"
              style={{ border: 'none', color: 'white' }}
            />
            <button className="nav-link active" style={{ width: '100%', justifyContent: 'center', marginTop: 10, border: 'none' }} type="submit" disabled={creatingDisruption}>
              {creatingDisruption ? 'Submitting...' : 'Create Event'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Active Disruptions</h3>
          <div className="table-container" style={{ marginTop: '1rem', maxHeight: 280 }}>
            <table>
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Zone</th>
                  <th>Threshold</th>
                  <th>Started</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeDisruptions.map((disruption) => (
                  <tr key={disruption.id}>
                    <td style={{ fontWeight: 700 }}>{disruption.id}</td>
                    <td>{disruption.type}</td>
                    <td>{disruption.zone}</td>
                    <td>{disruption.threshold_value || '-'}</td>
                    <td>{formatDateTime(disruption.start_time)}</td>
                    <td><span className="badge badge-danger">Live</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeDisruptions.length === 0 ? <EmptyState text="No active disruptions returned by backend." /> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Disruption History</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disruptionsHistory.map((disruption) => (
                <tr key={disruption.id}>
                  <td>{disruption.id}</td>
                  <td>{disruption.type}</td>
                  <td>{disruption.zone}</td>
                  <td>{formatDateTime(disruption.start_time)}</td>
                  <td>{formatDateTime(disruption.end_time)}</td>
                  <td><span className={`badge ${disruption.is_active ? 'badge-danger' : 'badge-success'}`}>{disruption.is_active ? 'Active' : 'Resolved'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {disruptionsHistory.length === 0 ? <EmptyState text="No disruptions history available." /> : null}
        </div>
      </div>
    </div>
  );
};

const FraudTab = ({ claims, pendingClaims, onResolveClaim, resolvingClaimId }) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalFlaggedToday = pendingClaims.filter((claim) => {
    const createdAt = toDate(claim.created_at);
    return createdAt && createdAt >= startOfToday;
  }).length;

  const autoResolved = claims.filter((claim) => claim.status === 'Approved' && Number(claim.ml_fraud_score || 0) > 0).length;
  const highConfidenceFraud = pendingClaims.filter((claim) => Number(claim.ml_fraud_score || 0) >= 0.8).length;

  const scoreDistribution = [
    { range: '0.0-0.2', min: 0, max: 0.2 },
    { range: '0.2-0.4', min: 0.2, max: 0.4 },
    { range: '0.4-0.6', min: 0.4, max: 0.6 },
    { range: '0.6-0.8', min: 0.6, max: 0.8 },
    { range: '0.8-1.0', min: 0.8, max: 1.01 },
  ].map((bin) => ({
    range: bin.range,
    count: claims.filter((claim) => {
      const score = Number(claim.ml_fraud_score);
      return Number.isFinite(score) && score >= bin.min && score < bin.max;
    }).length,
  }));

  const topRisk = pendingClaims
    .slice()
    .sort((a, b) => Number(b.ml_fraud_score || 0) - Number(a.ml_fraud_score || 0))[0];

  return (
    <div className="fade-in">
      <div className="kpi-grid">
        <KpiCard label="Total Flagged Today" value={formatNumber(totalFlaggedToday)} icon={ShieldAlert} color="var(--accent-red)" />
        <KpiCard label="Auto-Resolved" value={formatNumber(autoResolved)} icon={CheckCircle} color="var(--accent-green)" />
        <KpiCard label="Pending Review" value={formatNumber(pendingClaims.length)} icon={Activity} color="var(--accent-orange)" />
        <KpiCard label="High Confidence Fraud" value={formatNumber(highConfidenceFraud)} icon={AlertTriangle} color="var(--accent-red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3>Fraud Queue</h3>
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Worker</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td style={{ fontWeight: 700 }}>{claim.id}</td>
                    <td>{claim.worker?.name || '-'}</td>
                    <td>{Number(claim.ml_fraud_score || 0).toFixed(2)}</td>
                    <td><span className={`badge ${getStatusBadgeClass(claim.status)}`}>{claim.status}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{claim.resolution_note || 'Pending manual review'}</td>
                    <td>{formatDateTime(claim.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => onResolveClaim(claim.id, 'APPROVE')}
                          disabled={resolvingClaimId === claim.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Approve"
                        >
                          <CheckCircle size={16} color="var(--accent-green)" />
                        </button>
                        <button
                          onClick={() => onResolveClaim(claim.id, 'REJECT')}
                          disabled={resolvingClaimId === claim.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Reject"
                        >
                          <XCircle size={16} color="var(--accent-red)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingClaims.length === 0 ? <EmptyState text="No pending fraud claims." /> : null}
          </div>
        </div>

        <div className="card">
          <h3>Score Distribution</h3>
          <div style={{ height: 250, marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry) => (
                    <Cell key={entry.range} fill={entry.range === '0.8-1.0' ? 'var(--accent-red)' : 'var(--primary)'} />
                  ))}
                </Bar>
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 20, paddingTop: 15 }}>
            <h4 style={{ fontSize: '0.8rem' }}>Top Risk Case</h4>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {topRisk
                ? `Claim ${topRisk.id} (${topRisk.worker?.name || 'Unknown worker'}) score ${Number(topRisk.ml_fraud_score || 0).toFixed(2)} in ${topRisk.status} state.`
                : 'No high-risk pending case currently.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PayoutsTab = ({ payoutKpis, payoutTimeline, tierDistribution, recentPayouts }) => (
  <div className="fade-in">
    <div className="kpi-grid">
      <KpiCard label="Total Paid Today" value={formatCurrency(payoutKpis.paidToday)} icon={CreditCard} color="var(--accent-green)" />
      <KpiCard label="Total Paid This Week" value={formatCurrency(payoutKpis.paidWeek)} icon={TrendingUp} color="var(--primary)" />
      <KpiCard label="Avg Payout Time" value={`${payoutKpis.avgMinutes.toFixed(1)} min`} icon={Clock} color="var(--accent-green)" />
      <KpiCard label="SLA (<= 15 min)" value={formatPercent(payoutKpis.slaPercent)} icon={Zap} color="var(--accent-green)" />
    </div>

    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3>Payout Timeline (7 Days)</h3>
      <div style={{ height: 250, marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={payoutTimeline}>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Area type="monotone" dataKey="amount" stroke="var(--accent-red)" fill="rgba(244, 63, 94, 0.1)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="card">
        <h3>Worker Tier Distribution</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tierDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                {tierDistribution.map((tier) => <Cell key={tier.name} fill={tier.color} />)}
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
                <th>Claim ID</th>
                <th>Resolved At</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayouts.map((claim) => (
                <tr key={claim.id}>
                  <td style={{ fontWeight: 600 }}>{claim.id}</td>
                  <td>{formatDateTime(claim.resolved_at)}</td>
                  <td>{formatCurrency(claim.amount_credited)}</td>
                  <td><span className={`badge ${getStatusBadgeClass(claim.status)}`}>{claim.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentPayouts.length === 0 ? <EmptyState text="No completed payouts available." /> : null}
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsTab = ({ cityRiskIndex, disruptionFrequency, modelMetrics }) => (
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
                <th>Active Disruptions</th>
                <th>Avg Risk Score</th>
                <th>Risk Index</th>
              </tr>
            </thead>
            <tbody>
              {cityRiskIndex.map((city) => (
                <tr key={city.city}>
                  <td style={{ fontWeight: 700 }}>{city.city}</td>
                  <td>{city.workers}</td>
                  <td>{city.disruptions}</td>
                  <td>{city.avgRisk.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3 }}>
                        <div style={{ width: `${city.riskIndex * 10}%`, height: '100%', background: city.riskIndex > 7 ? 'var(--accent-red)' : 'var(--accent-green)', borderRadius: 3 }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{city.riskIndex.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cityRiskIndex.length === 0 ? <EmptyState text="No city-level worker data available." /> : null}
        </div>
      </div>

      <div className="card">
        <h3>Disruption Frequency</h3>
        <div style={{ height: 250, marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disruptionFrequency}>
              <XAxis dataKey="type" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="card">
      <h3>Data Quality Metrics</h3>
      <div className="kpi-grid" style={{ marginTop: '1.5rem' }}>
        {modelMetrics.map((metric) => (
          <div key={metric.label} className="glass-card card" style={{ padding: 15 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{metric.label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metric.value}</span>
              <metric.icon size={20} color="var(--primary)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SettingsTab = ({ endpointStatus, backendHealth, apiBaseUrl }) => (
  <div className="fade-in">
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div className="card">
        <h3>API Integration Status</h3>
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {endpointStatus.map((service) => (
                <tr key={service.key}>
                  <td style={{ fontWeight: 600 }}>{service.name}</td>
                  <td>{service.path}</td>
                  <td><span className={`badge ${getStatusBadgeClass(service.status)}`}>{service.status}</span></td>
                  <td>{service.latencyMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
          {endpointStatus.length === 0 ? <EmptyState text="No endpoint status recorded yet." /> : null}
        </div>
      </div>

      <div className="card">
        <h3>Environment</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: '1rem' }}>
          <div className="glass-card" style={{ padding: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API Base URL</div>
            <div style={{ fontSize: '0.85rem', marginTop: 6 }}>{apiBaseUrl}</div>
          </div>
          <div className="glass-card" style={{ padding: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backend Health</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} color="var(--primary)" />
              <span className={`badge ${getStatusBadgeClass(backendHealth.status || 'error')}`}>{backendHealth.status || 'Unavailable'}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              DB: {backendHealth.db || 'unknown'}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configuration Note</div>
            <div style={{ fontSize: '0.8rem', marginTop: 6 }}>
              This panel is fully API-backed. No static integration list is used.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState(getStoredToken());
  const [authForm, setAuthForm] = useState({ phone: ADMIN_PHONE_DEFAULT, password: ADMIN_PASSWORD_DEFAULT });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [creatingDisruption, setCreatingDisruption] = useState(false);
  const [resolvingClaimId, setResolvingClaimId] = useState(null);

  const [backendHealth, setBackendHealth] = useState({ status: 'Unknown', db: 'Unknown' });
  const [endpointStatus, setEndpointStatus] = useState([]);

  const [data, setData] = useState({
    stats: null,
    workers: [],
    claims: [],
    pendingClaims: [],
    activeDisruptions: [],
    disruptions: [],
  });

  const clearSession = useCallback((message = '') => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setPageError(message);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setPageError('');
    setActionMessage('');

    const endpoints = [
      { key: 'stats', name: 'Dashboard Stats', path: '/admin/dashboard/stats', auth: true },
      { key: 'workers', name: 'Admin Workers', path: '/admin/workers?per_page=200', auth: true },
      { key: 'pendingClaims', name: 'Pending Claims', path: '/admin/claims/pending', auth: true },
      { key: 'claims', name: 'Claims', path: '/claims/?per_page=200', auth: true },
      { key: 'activeDisruptions', name: 'Active Disruptions', path: '/disruptions/active', auth: false },
      { key: 'disruptions', name: 'Disruptions History', path: '/disruptions/', auth: true },
    ];

    const results = await Promise.all(endpoints.map(async (endpoint) => {
      const start = performance.now();
      try {
        const payload = await requestJson(endpoint.path, { token: endpoint.auth ? token : undefined });
        return {
          ...endpoint,
          ok: true,
          payload,
          latencyMs: Math.round(performance.now() - start),
        };
      } catch (error) {
        return {
          ...endpoint,
          ok: false,
          error,
          latencyMs: Math.round(performance.now() - start),
        };
      }
    }));

    const unauthorized = results.some((result) => result.auth && !result.ok && result.error?.status === 401);
    if (unauthorized) {
      setLoading(false);
      clearSession('Session expired. Please sign in again.');
      return;
    }

    const nextData = {
      stats: null,
      workers: [],
      claims: [],
      pendingClaims: [],
      activeDisruptions: [],
      disruptions: [],
    };

    results.forEach((result) => {
      if (!result.ok) {
        return;
      }
      if (result.key === 'stats') {
        nextData.stats = result.payload || null;
      }
      if (result.key === 'workers') {
        nextData.workers = result.payload?.workers || [];
      }
      if (result.key === 'pendingClaims') {
        nextData.pendingClaims = Array.isArray(result.payload) ? result.payload : [];
      }
      if (result.key === 'claims') {
        nextData.claims = result.payload?.claims || [];
      }
      if (result.key === 'activeDisruptions') {
        nextData.activeDisruptions = Array.isArray(result.payload) ? result.payload : [];
      }
      if (result.key === 'disruptions') {
        nextData.disruptions = Array.isArray(result.payload) ? result.payload : [];
      }
    });

    const failed = results.filter((result) => !result.ok);
    if (failed.length) {
      setPageError(`Some data sources failed to load: ${failed.map((item) => item.name).join(', ')}.`);
    }

    setEndpointStatus(results.map((result) => ({
      key: result.key,
      name: result.name,
      path: result.path,
      status: result.ok ? 'Live' : 'Degraded',
      latencyMs: result.latencyMs,
    })));

    try {
      const health = await requestHealth();
      setBackendHealth(health);
    } catch {
      setBackendHealth({ status: 'Unavailable', db: 'unknown' });
    }

    setData(nextData);
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, [clearSession, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    loadDashboard();
  }, [token, loadDashboard]);

  useEffect(() => {
    if (!token) {
      return;
    }
    const intervalId = window.setInterval(() => {
      loadDashboard();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [token, loadDashboard]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setPageError('');

    try {
      const response = await requestJson('/auth/admin/login', {
        method: 'POST',
        body: {
          phone: authForm.phone,
          password: authForm.password,
        },
      });
      const accessToken = response?.access_token;
      if (!accessToken) {
        throw new Error('Access token was not returned from backend.');
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      setToken(accessToken);
    } catch (error) {
      setAuthError(error.message || 'Unable to login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession('Logged out.');
  };

  const handleCreateDisruption = async (payload) => {
    setCreatingDisruption(true);
    setActionMessage('');
    try {
      await requestJson('/disruptions/', {
        method: 'POST',
        token,
        body: payload,
      });
      setActionMessage('Disruption created successfully.');
      await loadDashboard();
    } catch (error) {
      setActionMessage(error.message || 'Unable to create disruption.');
    } finally {
      setCreatingDisruption(false);
    }
  };

  const handleResolveClaim = async (claimId, action) => {
    setResolvingClaimId(claimId);
    setActionMessage('');
    try {
      await requestJson(`/claims/${claimId}/resolve`, {
        method: 'PATCH',
        token,
        body: {
          action,
          reason: `Resolved from admin dashboard (${action})`,
        },
      });
      setActionMessage(`Claim ${claimId} ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      await loadDashboard();
    } catch (error) {
      setActionMessage(error.message || `Unable to resolve claim ${claimId}.`);
    } finally {
      setResolvingClaimId(null);
    }
  };

  const claimsById = useMemo(() => {
    return data.pendingClaims.reduce((accumulator, claim) => {
      accumulator[claim.id] = claim;
      return accumulator;
    }, {});
  }, [data.pendingClaims]);

  const enrichedClaims = useMemo(() => {
    return data.claims.map((claim) => {
      const pendingClaim = claimsById[claim.id];
      return {
        ...claim,
        workerName: pendingClaim?.worker?.name || 'Worker unavailable',
      };
    });
  }, [claimsById, data.claims]);

  const stats = data.stats || {};

  const kpis = useMemo(() => {
    return [
      { label: 'Total Active Workers', value: formatNumber(stats.total_workers || data.workers.length), icon: Users, color: 'var(--primary)' },
      { label: 'Total Claims', value: formatNumber(stats.total_claims || data.claims.length), icon: Shield, color: 'var(--accent-green)' },
      { label: 'Payouts This Week', value: formatCurrency(stats.total_payouts_week || 0), icon: CreditCard, color: 'var(--accent-orange)' },
      { label: 'Active Disruptions', value: formatNumber(stats.active_disruptions || data.activeDisruptions.length), icon: CloudLightning, color: 'var(--accent-red)' },
      { label: 'Pending Reviews', value: formatNumber(stats.pending_reviews || data.pendingClaims.length), icon: ShieldAlert, color: 'var(--accent-orange)' },
      { label: 'Approval Rate', value: formatPercent(stats.approval_rate || 0), icon: Zap, color: 'var(--accent-green)' },
    ];
  }, [data.activeDisruptions.length, data.claims.length, data.pendingClaims.length, data.workers.length, stats.active_disruptions, stats.approval_rate, stats.pending_reviews, stats.total_claims, stats.total_payouts_week, stats.total_workers]);

  const recentClaims = useMemo(() => {
    return enrichedClaims
      .slice()
      .sort((a, b) => (toDate(b.created_at)?.getTime() || 0) - (toDate(a.created_at)?.getTime() || 0))
      .slice(0, 6);
  }, [enrichedClaims]);

  const tierDistribution = useMemo(() => {
    const counters = { Bronze: 0, Silver: 0, Gold: 0 };
    data.workers.forEach((worker) => {
      if (counters[worker.tier] !== undefined) {
        counters[worker.tier] += 1;
      }
    });
    return Object.keys(counters).map((tier) => ({ name: tier, value: counters[tier], color: TIER_COLORS[tier] }));
  }, [data.workers]);

  const paidClaims = useMemo(() => {
    return enrichedClaims.filter((claim) => claim.status === 'Approved' && Number(claim.amount_credited || 0) > 0);
  }, [enrichedClaims]);

  const payoutKpis = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    let paidToday = 0;
    let paidWeek = 0;
    let resolvedWithinSla = 0;
    let resolvedTotal = 0;
    let totalMinutes = 0;

    paidClaims.forEach((claim) => {
      const resolvedAt = toDate(claim.resolved_at);
      const createdAt = toDate(claim.created_at);
      const amount = Number(claim.amount_credited || 0);

      if (resolvedAt && resolvedAt >= dayStart) {
        paidToday += amount;
      }
      if (resolvedAt && resolvedAt >= weekStart) {
        paidWeek += amount;
      }

      if (resolvedAt && createdAt) {
        const minutes = Math.max(0, (resolvedAt.getTime() - createdAt.getTime()) / 60000);
        totalMinutes += minutes;
        resolvedTotal += 1;
        if (minutes <= 15) {
          resolvedWithinSla += 1;
        }
      }
    });

    return {
      paidToday,
      paidWeek,
      avgMinutes: resolvedTotal ? totalMinutes / resolvedTotal : 0,
      slaPercent: resolvedTotal ? (resolvedWithinSla / resolvedTotal) * 100 : 0,
    };
  }, [paidClaims]);

  const payoutTimeline = useMemo(() => {
    const points = [];
    const today = new Date();

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const dayStart = day.getTime();
      const dayEnd = dayStart + 24 * 3600 * 1000;

      let amount = 0;
      paidClaims.forEach((claim) => {
        const resolvedAt = toDate(claim.resolved_at);
        if (resolvedAt) {
          const timestamp = resolvedAt.getTime();
          if (timestamp >= dayStart && timestamp < dayEnd) {
            amount += Number(claim.amount_credited || 0);
          }
        }
      });

      points.push({
        day: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        amount: Math.round(amount),
      });
    }

    return points;
  }, [paidClaims]);

  const recentPayouts = useMemo(() => {
    return paidClaims
      .slice()
      .sort((a, b) => (toDate(b.resolved_at)?.getTime() || 0) - (toDate(a.resolved_at)?.getTime() || 0))
      .slice(0, 10);
  }, [paidClaims]);

  const cityRiskIndex = useMemo(() => {
    const grouped = {};

    data.workers.forEach((worker) => {
      const city = worker.city || 'Unknown';
      if (!grouped[city]) {
        grouped[city] = { city, workers: 0, disruptions: 0, riskSum: 0 };
      }
      grouped[city].workers += 1;
      grouped[city].riskSum += Number(worker.risk_score || 0);
    });

    data.activeDisruptions.forEach((disruption) => {
      const city = Object.keys(grouped).find((name) => disruption.zone?.toLowerCase().includes(name.toLowerCase()));
      if (city && grouped[city]) {
        grouped[city].disruptions += 1;
      }
    });

    return Object.values(grouped)
      .map((city) => {
        const avgRisk = city.workers ? city.riskSum / city.workers : 0;
        return {
          city: city.city,
          workers: city.workers,
          disruptions: city.disruptions,
          avgRisk,
          riskIndex: Math.min(10, avgRisk * 10),
        };
      })
      .sort((a, b) => b.riskIndex - a.riskIndex);
  }, [data.activeDisruptions, data.workers]);

  const disruptionFrequency = useMemo(() => {
    const counters = {};
    data.disruptions.forEach((disruption) => {
      const type = disruption.type || 'Unknown';
      counters[type] = (counters[type] || 0) + 1;
    });
    return Object.entries(counters).map(([type, count]) => ({ type, count }));
  }, [data.disruptions]);

  const modelMetrics = useMemo(() => {
    const totalClaims = data.claims.length || 1;
    const scoredClaims = data.claims.filter((claim) => Number.isFinite(Number(claim.ml_fraud_score))).length;
    const resolvedClaims = data.claims.filter((claim) => claim.status === 'Approved' || claim.status === 'Blocked').length;

    return [
      { label: 'Fraud Score Coverage', value: formatPercent((scoredClaims / totalClaims) * 100), icon: Shield },
      { label: 'Claim Resolution Coverage', value: formatPercent((resolvedClaims / totalClaims) * 100), icon: CheckCircle },
      { label: 'Approval Rate', value: formatPercent(stats.approval_rate || 0), icon: TrendingUp },
      { label: 'Pending Review Rate', value: formatPercent(((stats.pending_reviews || data.pendingClaims.length) / totalClaims) * 100), icon: AlertTriangle },
    ];
  }, [data.claims, data.pendingClaims.length, stats.approval_rate, stats.pending_reviews]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab kpis={kpis} activeDisruptions={data.activeDisruptions} recentClaims={recentClaims} />;
      case 'workers':
        return <WorkersTab workers={data.workers} />;
      case 'disruptions':
        return (
          <DisruptionsTab
            activeDisruptions={data.activeDisruptions}
            disruptionsHistory={data.disruptions}
            onCreateDisruption={handleCreateDisruption}
            creatingDisruption={creatingDisruption}
          />
        );
      case 'fraud':
        return (
          <FraudTab
            claims={data.claims}
            pendingClaims={data.pendingClaims}
            onResolveClaim={handleResolveClaim}
            resolvingClaimId={resolvingClaimId}
          />
        );
      case 'payouts':
        return (
          <PayoutsTab
            payoutKpis={payoutKpis}
            payoutTimeline={payoutTimeline}
            tierDistribution={tierDistribution}
            recentPayouts={recentPayouts}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            cityRiskIndex={cityRiskIndex}
            disruptionFrequency={disruptionFrequency}
            modelMetrics={modelMetrics}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            endpointStatus={endpointStatus}
            backendHealth={backendHealth}
            apiBaseUrl={API_BASE_URL}
          />
        );
      default:
        return <OverviewTab kpis={kpis} activeDisruptions={data.activeDisruptions} recentClaims={recentClaims} />;
    }
  };

  if (!token) {
    return (
      <LoginView
        form={authForm}
        setForm={setAuthForm}
        onSubmit={handleLogin}
        loading={authLoading}
        error={authError || pageError}
      />
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <Header
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
          loading={loading}
          onRefresh={loadDashboard}
          onLogout={handleLogout}
          lastUpdated={lastUpdated}
        />

        {pageError ? (
          <div className="badge badge-warning" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            {pageError}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="badge badge-primary" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            {actionMessage}
          </div>
        ) : null}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
