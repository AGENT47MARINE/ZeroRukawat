import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, CreditCard, Bell, User,
  ChevronRight, CheckCircle2,
  ShieldCheck, Smartphone,
  Zap, AlertTriangle, CloudRain,
  LogOut, MessageCircle, MoreHorizontal, ArrowLeft,
  RefreshCw, Loader, TrendingUp, Info
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell
} from 'recharts';
import { api } from './api';
import './index.css';

// ── Zone options ─────────────────────────────────────────────────────────────
const VALID_ZONES = [
  'Mumbai_Kurla', 'Mumbai_Andheri', 'Mumbai_Thane',
  'Delhi_North',  'Delhi_South',
  'Bangalore_South', 'Bangalore_North',
  'Chennai_Central', 'Hyderabad_West', 'Kolkata_Central',
];

const PAYOUT_STAGE_LABELS = {
  requested: 'Requested',
  fraud_check: 'Fraud Check',
  income_estimation: 'Income Estimate',
  payment_processing: 'Processing Transfer',
  credited: 'Credited',
  held: 'Held',
  blocked: 'Blocked',
  failed: 'Failed',
};

const TERMINAL_STAGES = new Set(['credited', 'held', 'blocked', 'failed']);

function getStageLabel(stage) {
  return PAYOUT_STAGE_LABELS[stage] || 'Processing';
}

function getStageColor(stage) {
  if (stage === 'credited') return '#16a34a';
  if (stage === 'held') return '#d97706';
  if (stage === 'blocked' || stage === 'failed') return '#dc2626';
  return '#4F46E5';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Build 7-day bar chart data from real payouts returned by the backend.
 * Each entry: { day: 'Mon', amount: 450, disrupted: true/false }
 * Days without payouts show 0.
 */
function buildWeeklyChart(payouts = []) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today    = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    const iso     = d.toISOString().split('T')[0];        // "2026-03-31"
    const dayName = dayNames[d.getDay()];
    const matched = payouts.filter(p => p.date === iso);
    const amount  = matched.reduce((s, p) => s + (p.amount || 0), 0);
    return { day: dayName, amount, disrupted: amount > 0 };
  });
}

/** Map risk_score (0–1) → disruption probability label for the risk card. */
function riskLabel(score = 0.5) {
  if (score < 0.3) return { pct: Math.round(score * 100), text: 'Low risk zone 🟢', color: '#16a34a' };
  if (score < 0.6) return { pct: Math.round(score * 100), text: 'Moderate risk zone 🟡', color: '#d97706' };
  return               { pct: Math.round(score * 100), text: 'High risk zone 🔴',  color: '#dc2626' };
}

// ── Shell ────────────────────────────────────────────────────────────────────
const MobileShell = ({ children, activeTab, setActiveTab, hideNav }) => (
  <div className="mobile-container">
    <div className="status-bar">
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <Smartphone size={14} />
        <div style={{ width: 14, height: 14, background: '#10b981', borderRadius: '50%', border: '2px solid white' }} />
      </div>
    </div>
    <div className="mobile-content">{children}</div>
    {!hideNav && (
      <nav className="bottom-nav">
        {[
          { id: 'home',    label: 'Home',    icon: Home },
          { id: 'payouts', label: 'Payouts', icon: CreditCard },
          { id: 'alerts',  label: 'Alerts',  icon: Bell },
          { id: 'profile', label: 'Profile', icon: User },
        ].map(item => (
          <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}>
            <item.icon size={24} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    )}
  </div>
);

const ErrorBanner = ({ message, onClose }) => (
  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠ {message}</span>
    <span onClick={onClose} style={{ cursor: 'pointer', color: '#dc2626', fontSize: 18, lineHeight: 1 }}>×</span>
  </div>
);

const Spinner = () => (
  <div style={{ textAlign: 'center', padding: 40, color: '#6366f1' }}>
    <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
    <p style={{ fontSize: 13, marginTop: 10, color: 'var(--text-muted)' }}>Loading...</p>
  </div>
);

// ── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const [screen, setScreen]       = useState('splash');
  const [activeTab, setActiveTab] = useState('home');

  // ─ API state
  const [token, setToken]                         = useState(localStorage.getItem('zr_token'));
  const [currentWorker, setCurrentWorker]         = useState(null);
  const [currentPolicy, setCurrentPolicy]         = useState(null);
  const [payouts, setPayouts]                     = useState([]);
  const [activeDisruptions, setActiveDisruptions] = useState([]);
  const [workerInsights, setWorkerInsights]       = useState(null);
  const [tabLoading, setTabLoading]               = useState(false);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);
  const [payoutActionError, setPayoutActionError] = useState('');

  // ─ Form state
  const [formData, setFormData] = useState({
    name: '', mobile: '', city: 'Mumbai', zone: 'Mumbai_Kurla',
    platform: 'Amazon', partnerID: '', aadhaar: '', upi: ''
  });
  const [otpInput, setOtpInput]   = useState('');
  const [otpReference, setOtpReference] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState('');
  const [kycProgress, setKycProgress] = useState(0);

  // ─── Derived data (computed from real API responses — NO mock) ────────────
  const weeklyChart   = buildWeeklyChart(payouts);
  const totalPaid     = payouts.reduce((s, p) => s + (p.amount || 0), 0);
  const aiRiskScore   = workerInsights?.risk?.score ?? currentWorker?.risk_score ?? 0.5;
  const aiDisruption  = workerInsights?.disruption || null;
  const riskInfo      = riskLabel(aiRiskScore);
  const inProgressPayout = payouts.find(
    p => !(p.is_terminal ?? TERMINAL_STAGES.has(p.payout_stage))
  );
  const workerInitials = currentWorker
    ? currentWorker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '--';

  const loadWorkerInsights = async (jwt) => {
    if (!jwt) return;
    try {
      const insightsResp = await api.getWorkerInsights(jwt);
      setWorkerInsights(insightsResp.data || null);
    } catch (e) {
      console.error('Worker insights fetch:', e);
      setWorkerInsights(null);
    }
  };

  const loadPayouts = useCallback(async (workerId, jwt, showLoader = false) => {
    if (!workerId || !jwt) return;
    if (showLoader) setTabLoading(true);
    try {
      const payResp = await api.getPayouts(workerId, jwt);
      setPayouts(payResp.data || []);
    } catch (e) {
      console.error('Payouts fetch:', e);
    } finally {
      if (showLoader) setTabLoading(false);
    }
  }, []);

  // ─── Session restore on mount ──────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const meResp  = await api.getMe(token);
        const worker  = meResp.data;
        setCurrentWorker(worker);
        const polResp = await api.getPolicy(worker.id, token);
        setCurrentPolicy(polResp.data);
        await loadPayouts(worker.id, token);
        const disResp = await api.getActiveDisruptions();
        setActiveDisruptions(disResp.data || []);
        await loadWorkerInsights(token);
        setScreen('dashboard');
      } catch {
        localStorage.removeItem('zr_token');
        setToken(null);
      }
    })();
  }, [loadPayouts]); // runs once on mount to restore session

  // ─── KYC animation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'kyc') return;
    setKycProgress(0);
    const t = setInterval(() => {
      setKycProgress(prev => {
        if (prev >= 100) { clearInterval(t); return 100; }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(t);
  }, [screen]);

  // ─── Fetch disruptions when alerts tab is opened ──────────────────────────
  useEffect(() => {
    if (activeTab !== 'alerts') return;
    setTabLoading(true);
    Promise.all([
      api.getActiveDisruptions(),
      token ? api.getWorkerInsights(token) : Promise.resolve(null),
    ])
      .then(([disResp, insightsResp]) => {
        setActiveDisruptions(disResp?.data || []);
        if (insightsResp?.data) setWorkerInsights(insightsResp.data);
      })
      .catch(e  => console.error('Disruptions/insights fetch:', e))
      .finally(() => setTabLoading(false));
  }, [activeTab, token]);

  // ─── Fetch payouts when payouts tab is opened ─────────────────────────────
  useEffect(() => {
    if (activeTab !== 'payouts' || !currentWorker || !token) return;
    loadPayouts(currentWorker.id, token, true);
  }, [activeTab, currentWorker, token, loadPayouts]);

  useEffect(() => {
    if (activeTab !== 'payouts' || !currentWorker || !token || !inProgressPayout) return;

    const timer = setInterval(() => {
      loadPayouts(currentWorker.id, token, false);
    }, 2500);

    return () => clearInterval(timer);
  }, [activeTab, currentWorker, token, inProgressPayout?.claim_id, loadPayouts]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const phone = () => formData.mobile.replace(/\D/g, '').slice(-10);

  const handleRegister = async () => {
    if (!formData.name || !formData.mobile) return setApiError('Name and mobile number are required.');
    setLoading(true); setApiError('');
    try {
      const resp = await api.register({
        phone: phone(), name: formData.name, city: formData.city,
        zone: formData.zone, tier: 'Silver', upi_id: formData.upi,
      });
      setOtpReference(resp?.data?.reference || '');
      setRegistrationToken(resp?.data?.registration_token || '');
      setScreen('otp');
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  const handleOtpVerify = async () => {
    if (!otpInput) return setApiError('Enter your OTP');
    if (!registrationToken) return setApiError('Session expired. Please register again.');
    setLoading(true); setApiError('');
    try {
      const resp = await api.verifyRegisterOtp(phone(), otpInput, registrationToken);
      const jwt  = resp.data.access_token;
      localStorage.setItem('zr_token', jwt);
      setToken(jwt);
      setCurrentWorker(resp.data.worker);
      setCurrentPolicy(resp.data.policy);
      // fetch payouts + disruptions now so dashboard is ready
      const [payResp, disResp] = await Promise.all([
        api.getPayouts(resp.data.worker.id, jwt),
        api.getActiveDisruptions(),
      ]);
      setPayouts(payResp.data || []);
      setActiveDisruptions(disResp.data || []);
      await loadWorkerInsights(jwt);
      setScreen('kyc');
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('zr_token');
    setToken(null); setCurrentWorker(null); setCurrentPolicy(null);
    setWorkerInsights(null);
    setPayouts([]); setActiveDisruptions([]);
    setScreen('splash');
  };

  const handlePayoutInitiation = async () => {
    if (!currentWorker || !token) return;

    setPayoutActionLoading(true);
    setPayoutActionError('');

    try {
      await api.initiatePayout(
        currentWorker.id,
        { disrupted_days: 1 },
        token
      );
      await loadPayouts(currentWorker.id, token, false);
    } catch (err) {
      setPayoutActionError(err.message);
    } finally {
      setPayoutActionLoading(false);
    }
  };

  // ── SCREEN — Splash ────────────────────────────────────────────────────────
  if (screen === 'splash') return (
    <div className="mobile-container" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)', color: 'white' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', marginBottom: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <ShieldCheck size={48} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>GigShield</h1>
        <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.4 }}>Income protection for Amazon & Flipkart delivery partners</p>
        <div style={{ width: '100%', marginTop: 60, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setScreen('register')} className="btn btn-primary"
            style={{ background: '#25D366', color: 'white', padding: '18px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <MessageCircle size={20} /> Sign Up via WhatsApp
          </button>
          <button onClick={() => setScreen('register')} className="btn"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            Sign Up via App
          </button>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>Under 5 minutes. No paperwork.</p>
      </div>
    </div>
  );

  // ── SCREEN — Register ──────────────────────────────────────────────────────
  if (screen === 'register') return (
    <MobileShell hideNav>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24 }}>Registration</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Secure your daily earnings in minutes.</p>
      </div>
      {apiError && <ErrorBanner message={apiError} onClose={() => setApiError('')} />}
      <div className="slide-up">
        <div className="input-group"><span className="input-label">Full Name *</span>
          <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Rahul Sharma" /></div>
        <div className="input-group"><span className="input-label">Mobile Number *</span>
          <input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="9876543210" type="tel" /></div>
        <div className="input-group">
          <span className="input-label">City</span>
          <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}>
            {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <span className="input-label">Delivery Zone</span>
          <select value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })}>
            {VALID_ZONES.map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div className="input-group">
          <span className="input-label">Platform</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {['Amazon', 'Flipkart'].map(p => (
              <div key={p} onClick={() => setFormData({ ...formData, platform: p })}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${formData.platform === p ? 'var(--primary)' : 'var(--border-color)'}`, background: formData.platform === p ? 'var(--primary-light)' : 'white', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="input-group"><span className="input-label">Partner ID</span>
          <input value={formData.partnerID} onChange={e => setFormData({ ...formData, partnerID: e.target.value })} placeholder="AZN-847291" /></div>
        <div className="input-group"><span className="input-label">Aadhaar Number (Masked)</span>
          <input value={formData.aadhaar} onChange={e => setFormData({ ...formData, aadhaar: e.target.value })} placeholder="XXXX XXXX 1234" /></div>
        <div className="input-group"><span className="input-label">UPI ID (For payouts)</span>
          <input value={formData.upi} onChange={e => setFormData({ ...formData, upi: e.target.value })} placeholder="rahul@upi" /></div>
        <button onClick={handleRegister} disabled={loading} className="btn btn-primary"
          style={{ marginTop: 20, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><Loader size={16} /> Registering...</> : 'Verify & Continue'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 15 }}>Your data is encrypted and never shared.</p>
      </div>
    </MobileShell>
  );

  // ── SCREEN — OTP ───────────────────────────────────────────────────────────
  if (screen === 'otp') return (
    <MobileShell hideNav>
      <div style={{ textAlign: 'center', padding: '20px 0 30px' }}>
        <div style={{ width: 64, height: 64, background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Smartphone size={28} color="#4F46E5" />
        </div>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Verify Your Phone</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          OTP sent to <strong>+91 {phone()}</strong><br />
          <span style={{ color: '#4F46E5', fontWeight: 700 }}>Enter the OTP received on SMS</span>
        </p>
        {otpReference && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            Request reference: {otpReference}
          </p>
        )}
      </div>
      {apiError && <ErrorBanner message={apiError} onClose={() => setApiError('')} />}
      <div className="input-group">
        <span className="input-label">Enter OTP</span>
        <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="123456" maxLength={6}
          style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }} />
      </div>
      <button onClick={handleOtpVerify} disabled={loading} className="btn btn-primary"
        style={{ marginTop: 16, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? <><Loader size={16} /> Verifying...</> : 'Verify OTP'}
      </button>
      <button onClick={() => { setScreen('register'); setApiError(''); }} className="btn"
        style={{ marginTop: 10, background: 'white', border: '1px solid var(--border-color)' }}>← Back</button>
    </MobileShell>
  );

  // ── SCREEN — KYC (animation) ───────────────────────────────────────────────
  if (screen === 'kyc') {
    const isDone = kycProgress === 100;
    return (
      <MobileShell hideNav>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2 style={{ marginBottom: 30 }}>Verifying Your Identity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Phone Verification', done: kycProgress > 40 },
              { label: 'Policy Activation',  done: kycProgress > 70 },
              { label: 'UPI ID Status',       done: kycProgress === 100 },
            ].map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderLeft: `4px solid ${item.done ? '#22c55e' : '#4F46E5'}` }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.done ? '#22c55e' : '#4F46E5' }}>
                  {item.done ? 'Done ✓' : 'Processing...'}
                </span>
              </div>
            ))}
          </div>
          {isDone ? (
            <div className="fade-in" style={{ marginTop: 40 }}>
              <CheckCircle2 color="#22c55e" size={64} style={{ marginBottom: 20 }} />
              <button onClick={() => setScreen('plan')} className="btn btn-primary">Proceed to Plan</button>
            </div>
          ) : (
            <div style={{ marginTop: 60, width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${kycProgress}%`, height: '100%', background: '#4F46E5', transition: 'width 0.2s linear' }} />
            </div>
          )}
        </div>
      </MobileShell>
    );
  }

  // ── SCREEN — Plan ──────────────────────────────────────────────────────────
  if (screen === 'plan') {
    const tierColors = { Bronze: '#CD7F32', Silver: '#94a3b8', Gold: '#fbbf24' };
    const plans = [
      { title: 'Bronze', earn: 'Up to ₹4,000',    price: '₹49/week', max: '₹2,450' },
      { title: 'Silver', earn: '₹4,000–₹7,000',   price: `₹${currentPolicy?.weekly_premium ?? 79}/week`, max: `₹${currentPolicy?.max_payout?.toLocaleString('en-IN') ?? '3,850'}`, selected: true },
      { title: 'Gold',   earn: '₹7,000 and above', price: '₹99/week', max: '₹6,300' },
    ];
    return (
      <MobileShell hideNav>
        <h2 style={{ marginBottom: 20 }}>Your Weekly Premium</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {plans.map((plan, i) => (
            <div key={i} className="card" style={{ border: plan.selected ? '2px solid var(--primary)' : '1px solid var(--border-color)', padding: 20, position: 'relative' }}>
              {plan.selected && <div style={{ position: 'absolute', top: -10, right: 20, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>AI RECOMMENDATION</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, color: tierColors[plan.title], fontSize: 18 }}>{plan.title}</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{plan.price}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Weekly Earnings:</span><span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{plan.earn}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Payout/Week:</span><span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{plan.max}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Coverage:</span><span style={{ color: 'var(--text-main)', fontWeight: 600 }}>70% of lost income</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ background: '#EEF2FF', border: '1px dashed #4F46E5', display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
          <div style={{ background: 'white', padding: 8, borderRadius: 8 }}><Zap size={20} color="#4F46E5" /></div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>
            AI assigned Silver tier based on your zone ({currentWorker?.zone}). Premium auto-set to ₹{currentPolicy?.weekly_premium ?? 79}/week.
          </p>
        </div>
        <button onClick={() => setScreen('activated')} className="btn btn-primary" style={{ marginTop: 24 }}>Activate Policy</button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 15 }}>Auto-deducted every Monday from your UPI. Cancel anytime.</p>
      </MobileShell>
    );
  }

  // ── SCREEN — Activated ─────────────────────────────────────────────────────
  if (screen === 'activated') return (
    <div className="mobile-container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div className="fade-in" style={{ width: 100, height: 100, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: 30 }}>
        <CheckCircle2 size={64} />
      </div>
      <h1 className="fade-in" style={{ marginBottom: 10 }}>You're protected, {currentWorker?.name?.split(' ')[0]}!</h1>
      <div className="card fade-in" style={{ width: '100%', textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        {[
          { label: 'Policy ID',     val: currentPolicy?.id?.slice(0, 18).toUpperCase() ?? '—' },
          { label: 'Tier',          val: currentWorker?.tier ?? '—' },
          { label: 'Weekly Premium',val: currentPolicy ? `₹${currentPolicy.weekly_premium}` : '—' },
          { label: 'Max Payout',    val: currentPolicy ? `₹${currentPolicy.max_payout?.toLocaleString('en-IN')}` : '—' },
          { label: 'Valid Until',   val: currentPolicy?.end_date ?? '—' },
        ].map(({ label, val }, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setScreen('dashboard')} className="btn btn-primary fade-in" style={{ marginTop: 40 }}>Go to Dashboard</button>
    </div>
  );

  // ── SCREEN — Risk Detail ───────────────────────────────────────────────────
  if (screen === 'risk') return (
    <MobileShell hideNav>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <ArrowLeft onClick={() => setScreen('dashboard')} style={{ cursor: 'pointer' }} />
        <h2 style={{ fontSize: 20 }}>Zone Risk Profile</h2>
      </div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)', color: 'white' }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Your risk score (from AI)</div>
        <div style={{ fontSize: 48, fontWeight: 800 }}>{riskInfo.pct}%</div>
        <div style={{ marginTop: 4, fontWeight: 600, fontSize: 14 }}>{riskInfo.text}</div>
        <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>
          Zone: <strong>{currentWorker?.zone}</strong> — higher score = higher disruption likelihood = higher premium.
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 13, marginBottom: 12 }}>Worker Profile</h4>
        {[
          { label: 'Zone',        val: currentWorker?.zone },
          { label: 'City',        val: currentWorker?.city },
          { label: 'Tier',        val: workerInsights?.risk?.tier_label || currentWorker?.tier },
          { label: 'Risk Score',  val: aiRiskScore?.toFixed(3) },
          { label: 'Max Payout',  val: currentPolicy ? `₹${currentPolicy.max_payout?.toLocaleString('en-IN')}` : '—' },
        ].map(({ label, val }, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ background: '#f8fafc', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={14} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Risk score is computed by an XGBoost model using zone history, weather frequency, and platform activity. It updates weekly.
          </p>
        </div>
      </div>
    </MobileShell>
  );

  // ── DASHBOARD TABS ─────────────────────────────────────────────────────────
  const renderDashboardTab = () => {
    switch (activeTab) {

      // HOME tab
      case 'home': return (
        <div className="slide-up">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 20 }}>Good morning, {currentWorker?.name?.split(' ')[0] ?? 'Worker'} 👋</h3>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>ACTIVE</span>
                <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{(currentWorker?.tier ?? 'SILVER').toUpperCase()}</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {workerInitials}
            </div>
          </div>

          {/* Today's Status — live from disruptions */}
          <div className="card" style={{ borderLeft: `4px solid ${activeDisruptions.length > 0 ? '#ef4444' : '#10b981'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Today's Status</span>
              {(aiDisruption?.triggered || activeDisruptions.length > 0) ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={16} /><span style={{ fontSize: 12, fontWeight: 700 }}>{aiDisruption?.type || activeDisruptions[0]?.type}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#10b981' }}>
                  <ShieldCheck size={16} /><span style={{ fontSize: 12, fontWeight: 700 }}>No Disruption</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Zone: {currentWorker?.zone ?? '—'} &nbsp;|&nbsp; Risk score: {aiRiskScore?.toFixed(2) ?? '0.50'}
            </div>
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12 }}>Payout Status:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: (aiDisruption?.triggered || activeDisruptions.length > 0) ? '#f59e0b' : 'var(--text-muted)' }}>
                {(aiDisruption?.triggered || activeDisruptions.length > 0) ? 'Processing...' : 'No payout today'}
              </span>
            </div>
          </div>

          {/* Weekly payouts bar chart — built from real payouts */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <h4 style={{ fontSize: 14 }}>This Week's Payouts</h4>
              <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                {totalPaid > 0 ? `Total: ₹${totalPaid.toLocaleString('en-IN')}` : 'No payouts this week'}
              </div>
            </div>
            {weeklyChart.every(d => d.amount === 0) ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No payouts in the last 7 days.<br />
                <span style={{ fontSize: 11 }}>Payouts appear here when a disruption is approved.</span>
              </div>
            ) : (
              <>
                <div style={{ height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChart}>
                      <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {weeklyChart.map((entry, i) => (
                          <Cell key={i} fill={entry.disrupted ? '#f43f5e' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  {weeklyChart.map(d => <span key={d.day} style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{d.day}</span>)}
                </div>
              </>
            )}
          </div>

          {/* Stats row — all real data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total Paid',    val: totalPaid > 0 ? `₹${(totalPaid / 1000).toFixed(1)}K` : '₹0' },
              { label: 'Disruptions',   val: activeDisruptions.length },
              { label: 'Policy',        val: currentPolicy?.status ?? '—' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 12, textAlign: 'center', marginBottom: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Risk zone card — real risk_score */}
          <div onClick={() => setScreen('risk')} className="card" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366f1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Zone Risk Report</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Risk score: {riskInfo.pct}% — {riskInfo.text}</div>
            </div>
            <ChevronRight size={24} />
          </div>
        </div>
      );

      // PAYOUTS tab
      case 'payouts': return (
        <div className="slide-up">
          <h3 style={{ marginBottom: 20 }}>Payout History</h3>

          <div className="card" style={{ borderLeft: '4px solid #4F46E5' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Run AI-Driven Payout Workflow</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Payout decision is automatic based on AI risk scoring and fraud checks.
            </p>

            <button
              onClick={handlePayoutInitiation}
              className="btn btn-primary"
              disabled={payoutActionLoading || tabLoading}
              style={{
                opacity: payoutActionLoading || tabLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {payoutActionLoading ? <><Loader size={16} /> Initiating...</> : 'Initiate AI Payout'}
            </button>

            {inProgressPayout && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>
                Live status: {getStageLabel(inProgressPayout.payout_stage)}
              </div>
            )}
          </div>

          {payoutActionError && (
            <ErrorBanner message={payoutActionError} onClose={() => setPayoutActionError('')} />
          )}

          {tabLoading ? <Spinner /> : payouts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <TrendingUp size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No payout records yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Initiate payout to see stage progression and final status.</p>
            </div>
          ) : payouts.map((p, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{p.reason}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: p.amount ? '#16a34a' : 'var(--text-muted)' }}>
                  {p.amount ? `₹${p.amount?.toLocaleString('en-IN')}` : 'Pending'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{p.date}</span>
                <span className="badge" style={{ fontSize: 8, background: `${getStageColor(p.payout_stage)}22`, color: getStageColor(p.payout_stage) }}>
                  {getStageLabel(p.payout_stage)}
                </span>
              </div>

              {Array.isArray(p.stage_timeline) && p.stage_timeline.length > 0 && (
                <div style={{ marginBottom: 8, background: '#f8fafc', borderRadius: 10, padding: 10 }}>
                  {p.stage_timeline.map((step, idx) => (
                    <div key={`${step.stage}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: idx === p.stage_timeline.length - 1 ? 0 : 6 }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{getStageLabel(step.stage)}</span>
                      <span>{step.at ? new Date(step.at).toLocaleTimeString('en-IN') : '--:--'}</span>
                    </div>
                  ))}
                </div>
              )}

              {p.payout_error_reason && (
                <div style={{ marginBottom: 8, fontSize: 11, color: '#dc2626' }}>
                  {p.payout_error_reason}
                </div>
              )}
              <div style={{ borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  ID: {p.claim_id?.slice(0, 18)}
                  {p.transaction_id ? ` · TXN: ${p.transaction_id}` : ''}
                </span>
                <MoreHorizontal size={16} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      );

      // ALERTS tab
      case 'alerts': return (
        <div className="slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Disruption Alerts</h3>
            <button onClick={() => {
              setTabLoading(true);
              Promise.all([
                api.getActiveDisruptions(),
                token ? api.getWorkerInsights(token) : Promise.resolve(null),
              ])
                .then(([disResp, insightsResp]) => {
                  setActiveDisruptions(disResp?.data || []);
                  if (insightsResp?.data) setWorkerInsights(insightsResp.data);
                })
                .finally(() => setTabLoading(false));
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}>
              <RefreshCw size={18} />
            </button>
          </div>
          {!tabLoading && aiDisruption?.triggered && (
            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <AlertTriangle color="#f59e0b" size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>AI Zone Alert</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {aiDisruption.type} in {aiDisruption.zone}
                  </div>
                  <div className="badge" style={{ background: '#fef3c7', color: '#b45309', marginTop: 8, display: 'inline-block' }}>
                    LIVE AI DETECTION
                  </div>
                </div>
              </div>
            </div>
          )}
          {tabLoading ? <Spinner /> : activeDisruptions.length === 0 ? (
            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <ShieldCheck color="#10b981" size={24} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>All Clear ✓</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>No active disruptions in your city right now.</div>
                </div>
              </div>
            </div>
          ) : activeDisruptions.map((d, i) => (
            <div key={i} className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <CloudRain color="#ef4444" size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Zone: {d.zone} · Threshold: {d.threshold_value}</div>
                  <div className="badge" style={{ background: '#fee2e2', color: '#ef4444', marginTop: 8, display: 'inline-block' }}>ACTIVE</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 10, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Started:</span><span>{new Date(d.start_time).toLocaleTimeString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Payout status:</span><span style={{ color: '#16a34a', fontWeight: 700 }}>Processing...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

      // PROFILE tab
      case 'profile': return (
        <div className="slide-up">
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: '#4F46E5', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 800 }}>
              {workerInitials}
            </div>
            <h3 style={{ fontSize: 18 }}>{currentWorker?.name ?? '—'}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>+91 {currentWorker?.phone ?? '—'}</p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: 13, marginBottom: 16 }}>My Policy</h4>
            {[
              { label: 'Policy ID',      val: currentPolicy?.id?.slice(0, 18).toUpperCase() ?? '—' },
              { label: 'Tier',           val: currentWorker?.tier ?? '—' },
              { label: 'Weekly Premium', val: currentPolicy ? `₹${currentPolicy.weekly_premium}` : '—' },
              { label: 'Max Payout',     val: currentPolicy ? `₹${currentPolicy.max_payout?.toLocaleString('en-IN')}` : '—' },
              { label: 'Status',         val: currentPolicy?.status ?? '—', color: '#16a34a' },
              { label: 'Valid Until',    val: currentPolicy?.end_date ?? '—' },
            ].map(({ label, val, color }, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: color || 'inherit' }}>{val}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: '#f8fafc' }}>
            <h4 style={{ fontSize: 13, marginBottom: 12 }}>Zone & Risk</h4>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[
                { label: 'Zone',       val: currentWorker?.zone?.replace('_', '\n') ?? '—' },
                { label: 'City',       val: currentWorker?.city ?? '—' },
                { label: 'Risk Score', val: aiRiskScore?.toFixed(2) ?? '—' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: '#f8fafc' }}>
            <h4 style={{ fontSize: 13, marginBottom: 8 }}>Payout Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {[
                { label: 'Total Paid',  val: totalPaid > 0 ? `₹${totalPaid.toLocaleString('en-IN')}` : '₹0' },
                { label: 'Claims',      val: payouts.length },
                { label: 'UPI',         val: currentWorker?.upi_id || '—' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleLogout} className="btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      );

      default: return null;
    }
  };

  // Dashboard wrapper
  return (
    <MobileShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderDashboardTab()}
    </MobileShell>
  );
};

export default App;
