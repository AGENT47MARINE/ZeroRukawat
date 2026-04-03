import React, { useState, useEffect } from 'react';
import {
  Home, CreditCard, Bell, User,
  ChevronRight, ArrowRight, CheckCircle2,
  ShieldCheck, Smartphone, MapPin, Building,
  Zap, Info, Clock, AlertTriangle, CloudRain,
  History, Calendar, TrendingUp, LogOut, MessageCircle, MoreHorizontal, ArrowLeft
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, AreaChart, Area
} from 'recharts';

// --- MOCK DATA ---
const EARNINGS_DATA = [
  { day: 'Mon', amount: 840, disrupted: false },
  { day: 'Tue', amount: 920, disrupted: false },
  { day: 'Wed', amount: 150, disrupted: true }, // Disrupted
  { day: 'Thu', amount: 780, disrupted: false },
  { day: 'Fri', amount: 810, disrupted: false },
  { day: 'Sat', amount: 950, disrupted: false },
  { day: 'Sun', amount: 880, disrupted: false },
];

const FORECAST_DATA = [
  { day: 'Mon', prob: 12 },
  { day: 'Tue', prob: 18 },
  { day: 'Wed', prob: 72 }, // Rain
  { day: 'Thu', prob: 45 },
  { day: 'Fri', prob: 20 },
  { day: 'Sat', prob: 15 },
  { day: 'Sun', prob: 10 },
];

const PAYOUT_HISTORY = [
  { id: '1', date: 'June 14, 2025', type: 'Heavy Rain', zone: 'Andheri West', amount: '₹2,450', status: 'Paid', event: 'BLR-RAIN-20250614-0823' },
  { id: '2', date: 'June 10, 2025', type: 'Dense Fog', zone: 'Bandra', amount: '₹1,200', status: 'Paid', event: 'MUM-FOG-20250610-0431' },
  { id: '3', date: 'May 28, 2025', type: 'Severe AQI', zone: 'Goregaon', amount: '₹1,850', status: 'Paid', event: 'MUM-AQI-20250528-0912' },
];

// --- COMPONENTS ---

const MobileShell = ({ children, activeTab, setActiveTab, hideNav }) => (
  <div className="mobile-container">
    <div className="status-bar">
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <Smartphone size={14} />
        <div style={{ width: 14, height: 14, background: '#10b981', borderRadius: '50%', border: '2px solid white' }}></div>
      </div>
    </div>
    <div className="mobile-content">{children}</div>
    {!hideNav && (
      <nav className="bottom-nav">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'payouts', label: 'Payouts', icon: CreditCard },
          { id: 'alerts', label: 'Alerts', icon: Bell },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={24} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    )}
  </div>
);

const App = () => {
  const [screen, setScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [formData, setFormData] = useState({
    name: 'Rahul Sharma',
    mobile: '+91 9876543210',
    city: 'Mumbai',
    zone: 'Andheri East',
    platform: 'Amazon',
    partnerID: 'AZN-847291',
    aadhaar: 'XXXX XXXX 1234',
    upi: 'rahul.sharma@upi'
  });

  const [kycProgress, setKycProgress] = useState(0);

  useEffect(() => {
    if (screen === 'kyc') {
      const timer = setInterval(() => {
        setKycProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [screen]);

  // Screen 1: Splash
  if (screen === 'splash') {
    return (
      <div className="mobile-container" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)', color: 'white' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', marginBottom: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <ShieldCheck size={48} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>GigShield</h1>
          <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.4 }}>Income protection for Amazon & Flipkart delivery partners</p>
          <div style={{ width: '100%', marginTop: 60, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setScreen('register')} className="btn btn-primary" style={{ background: '#25D366', color: 'white', padding: '18px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <MessageCircle size={20} /> Sign Up via WhatsApp
            </button>
            <button onClick={() => setScreen('register')} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Sign Up via App
            </button>
          </div>
          <p style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>Under 5 minutes. No paperwork.</p>
        </div>
      </div>
    );
  }

  // Screen 2: Registration
  if (screen === 'register') {
    return (
      <MobileShell hideNav>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 24 }}>Registration</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Secure your daily earnings in minutes.</p>
        </div>
        <div className="slide-up">
          <div className="input-group"><span className="input-label">Full Name</span><input defaultValue={formData.name} /></div>
          <div className="input-group"><span className="input-label">Mobile Number</span><input defaultValue={formData.mobile} /></div>
          <div className="input-group">
            <span className="input-label">City</span>
            <select defaultValue={formData.city}>
              {['Mumbai', 'Delhi NCR', 'Bengaluru', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Hyderabad'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group"><span className="input-label">Delivery Zone</span><input defaultValue={formData.zone} /></div>
          <div className="input-group">
            <span className="input-label">Platform</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Amazon', 'Flipkart'].map(p => (
                <div key={p} onClick={() => setFormData({ ...formData, platform: p })} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${formData.platform === p ? 'var(--primary)' : 'var(--border-color)'}`, background: formData.platform === p ? 'var(--primary-light)' : 'white', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  {p}
                </div>
              ))}
            </div>
          </div>
          <div className="input-group"><span className="input-label">Partner ID</span><input defaultValue={formData.partnerID} /></div>
          <div className="input-group"><span className="input-label">Aadhaar Number (Masked)</span><input defaultValue={formData.aadhaar} /></div>
          <div className="input-group"><span className="input-label">UPI ID (For payouts)</span><input defaultValue={formData.upi} /></div>
          <button onClick={() => setScreen('kyc')} className="btn btn-primary" style={{ marginTop: 20 }}>Verify & Continue</button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 15 }}>Your Aadhaar is verified via DigiLocker API. Your UPI ID is where payouts will land.</p>
        </div>
      </MobileShell>
    );
  }

  // Screen 3: KYC Status
  if (screen === 'kyc') {
    const isDone = kycProgress === 100;
    return (
      <MobileShell hideNav>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2 style={{ marginBottom: 30 }}>Verifying Your Identity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Aadhaar Verification', status: kycProgress > 40 ? 'Verified ✓' : 'Verifying...', color: kycProgress > 40 ? '#22c55e' : '#4F46E5' },
              { label: 'Platform Partner ID', status: kycProgress > 70 ? 'Confirmed ✓' : 'Checking with Platform...', color: kycProgress > 70 ? '#22c55e' : '#4F46E5' },
              { label: 'UPI ID Status', status: kycProgress === 100 ? 'UPI Active ✓' : 'Validating UPI...', color: kycProgress === 100 ? '#22c55e' : '#4F46E5' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderLeft: `4px solid ${item.color}` }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.status}</span>
              </div>
            ))}
          </div>
          {isDone ? (
            <div className="fade-in " style={{ marginTop: 40 }}>
              <CheckCircle2 color="#22c55e" size={64} style={{ marginBottom: 20 }} />
              <button onClick={() => setScreen('plan')} className="btn btn-primary">Proceed to Plan Selection</button>
            </div>
          ) : (
            <div style={{ marginTop: 60, width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${kycProgress}%`, height: '100%', background: '#4F46E5', transition: 'width 0.2s linear' }}></div>
            </div>
          )}
        </div>
      </MobileShell>
    );
  }

  // Screen 4: Plan Selection
  if (screen === 'plan') {
    return (
      <MobileShell hideNav>
        <h2 style={{ marginBottom: 20 }}>Your Weekly Premium</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { title: 'Bronze', earn: 'Up to ₹4,000', price: '₹49/week', max: '₹2,450', color: '#CD7F32' },
            { title: 'Silver', earn: '₹4,000 – ₹7,000', price: '₹79/week', max: '₹3,850', color: '#94a3b8', selected: true },
            { title: 'Gold', earn: '₹7,000 and above', price: '₹99/week', max: '₹6,300', color: '#fbbf24' },
          ].map((plan, i) => (
            <div key={i} onClick={() => { }} className="card" style={{
              border: plan.selected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              padding: 20, cursor: 'pointer', position: 'relative'
            }}>
              {plan.selected && <div style={{ position: 'absolute', top: -10, right: 20, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>AI RECOMMENDATION</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, color: plan.color, fontSize: 18 }}>{plan.title}</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{plan.price}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Weekly Earnings:</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{plan.earn}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Payout/Week:</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{plan.max}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Coverage:</span> <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>70% of lost income</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="card glass-card" style={{ background: '#EEF2FF', border: '1px dashed #4F46E5', display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
          <div style={{ background: 'white', padding: 8, borderRadius: 8 }}><Zap size={20} color="#4F46E5" /></div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>Our AI has assigned you Silver based on your zone and city risk.</p>
        </div>
        <button onClick={() => setScreen('activated')} className="btn btn-primary" style={{ marginTop: 24 }}>Activate Policy</button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 15 }}>Auto-deducted every Monday from your UPI. Cancel anytime.</p>
      </MobileShell>
    );
  }

  // Screen 5: Activated
  if (screen === 'activated') {
    return (
      <div className="mobile-container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="fade-in" style={{ width: 100, height: 100, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: 30 }}>
          <CheckCircle2 size={64} />
        </div>
        <h1 className="fade-in" style={{ marginBottom: 10 }}>You're protected, {formData.name.split(' ')[0]}!</h1>
        <div className="card fade-in" style={{ width: '100%', textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Policy ID</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>GS-BLR-002847</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>SILVER TIER</span>
            <span style={{ fontWeight: 800 }}>₹79/week</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Covers 70% of daily income during city-wide disruptions. Next premium auto-deduction: Monday, June 16.</p>
        </div>
        <button onClick={() => setScreen('dashboard')} className="btn btn-primary fade-in" style={{ marginTop: 40 }}>Go to Dashboard</button>
      </div>
    );
  }

  // Dashboard Sections
  const renderDashboardTab = () => {
    switch (activeTab) {
      case 'home': return (
        <div className="slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 20 }}>Good morning, Rahul 👋</h3>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>ACTIVE</span>
                <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>SILVER</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>RS</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Today's Status</span>
              {Math.random() > 0.5 ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#10b981' }}>
                  <ShieldCheck size={16} /> <span style={{ fontSize: 12, fontWeight: 700 }}>No Disruption</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={16} /> <span style={{ fontSize: 12, fontWeight: 700 }}>Heavy Rain</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Zone: Andheri East. All platforms operating normally.</div>
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12 }}>Payout Status:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>No payout today</span>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <h4 style={{ fontSize: 14 }}>Weekly Earnings Tracker</h4>
              <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Total: ₹5,330</div>
            </div>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EARNINGS_DATA}>
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {EARNINGS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.disrupted ? '#f43f5e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              {EARNINGS_DATA.map(d => <span key={d.day} style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{d.day}</span>)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total Payouts', val: '₹14K' },
              { label: 'Disruptions', val: '8' },
              { label: 'Weeks Active', val: '12' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: 12, textAlign: 'center', marginBottom: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div onClick={() => setScreen('forecast')} className="card" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366f1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Income Forecast</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>AI prediction for next week</div>
            </div>
            <ChevronRight size={24} />
          </div>
        </div>
      );
      case 'payouts': return (
        <div className="slide-up">
          <h3 style={{ marginBottom: 20 }}>Payout History</h3>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 10 }}>
            {['All', 'This Week', 'This Month', 'This Year'].map(f => (
              <span key={f} className="badge" style={{ background: f === 'All' ? 'var(--primary)' : 'white', color: f === 'All' ? 'white' : 'var(--text-muted)', border: '1px solid #e2e8f0', padding: '6px 12px', whiteSpace: 'nowrap' }}>{f}</span>
            ))}
          </div>
          {PAYOUT_HISTORY.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{p.type}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{p.amount}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{p.date} • {p.zone}</span>
                <span className="badge-success badge" style={{ fontSize: 8 }}>{p.status}</span>
              </div>
              <div style={{ pt: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {p.event}</span>
                <MoreHorizontal size={16} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      );
      case 'alerts': return (
        <div className="slide-up">
          <h3 style={{ marginBottom: 20 }}>Disruption Alerts</h3>
          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <CloudRain color="#ef4444" size={24} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Heavy Rain Detected</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Andheri West • Detected 12 mins ago</div>
                <div className="badge" style={{ background: '#fee2e2', color: '#ef4444', marginTop: 8, display: 'inline-block' }}>ACTIVE</div>
              </div>
            </div>
            <div style={{ marginTop: 15, padding: 10, background: '#f8fafc', borderRadius: 10, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Afected Workers:</span> <span>124</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>ETA for Payout:</span> <span style={{ color: '#16a34a', fontWeight: 700 }}>Processing...</span></div>
            </div>
          </div>

          <h4 style={{ margin: '25px 0 15px', fontSize: 14 }}>7-Day Disruption Forecast</h4>
          <div className="card" style={{ padding: '20px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, marginBottom: 10 }}>
              {FORECAST_DATA.map(d => (
                <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div style={{
                    width: 20,
                    height: d.prob,
                    background: d.prob > 60 ? '#ef4444' : d.prob > 30 ? '#f59e0b' : '#22c55e',
                    borderRadius: 4
                  }}></div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{d.prob}%</span>
                  <span style={{ fontSize: 9, fontWeight: 700 }}>{d.day}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>Next 7-day weather risk for Andheri East</p>
          </div>
        </div>
      );
      case 'profile': return (
        <div className="slide-up">
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: '#4F46E5', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 800 }}>RS</div>
            <h3 style={{ fontSize: 18 }}>Rahul Sharma</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>+91 9876543210</p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: 13, marginBottom: 16 }}>My Policy</h4>
            {[
              { label: 'Policy ID', val: 'GS-BLR-002847' },
              { label: 'Tier', val: 'Silver' },
              { label: 'Weekly Premium', val: '₹79' },
              { label: 'Status', val: 'Active', color: '#16a34a' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color || 'inherit' }}>{item.val}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: '#f8fafc' }}>
            <h4 style={{ fontSize: 13, marginBottom: 8 }}>Impact Report</h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 15 }}>GigShield has saved you ₹8,450 this year</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>12</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Disrupted Days</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>₹14,200</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Total Paid</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>98%</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>SLA Met</div>
              </div>
            </div>
          </div>

          <button className="btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      );
    }
  };

  // Screen 10: Forecast Detail
  if (screen === 'forecast') {
    return (
      <MobileShell hideNav>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ArrowLeft onClick={() => setScreen('dashboard')} style={{ cursor: 'pointer' }} />
          <h2 style={{ fontSize: 20 }}>Income Forecast</h2>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)', color: 'white' }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Disruption probability this week</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>72%</div>
          <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 12 }}>Estimated income at risk: <span style={{ fontWeight: 800 }}>₹2,450</span></div>
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
              💡 Consider activating Gold tier this week for better coverage.
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: 16, margin: '20px 0 12px' }}>Disruption Probability</h3>
        <div className="card" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FORECAST_DATA}>
              <defs>
                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="prob" stroke="#4F46E5" fillOpacity={1} fill="url(#colorProb)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4 style={{ fontSize: 13, marginBottom: 15 }}>Risk Breakdown</h4>
          {[
            { label: 'Monsoon Rain', val: '72%', color: '#6366f1' },
            { label: 'Extreme Heat', val: '12%', color: '#fb923c' },
            { label: 'Dense Fog', val: '5%', color: '#94a3b8' },
            { label: 'AQI Issues', val: '11%', color: '#ef4444' },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{r.label}</span>
                <span style={{ fontWeight: 700 }}>{r.val}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                <div style={{ width: r.val, height: '100%', background: r.color, borderRadius: 3 }}></div>
              </div>
            </div>
          ))}
        </div>
      </MobileShell>
    );
  }

  // Dashboard Wrapper
  return (
    <MobileShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderDashboardTab()}
    </MobileShell>
  );
};

export default App;
