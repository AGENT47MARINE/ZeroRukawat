import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ShieldAlert, AlertCircle, FileSearch, Trash2, CheckCircle2, Search, Filter, ChevronDown } from 'lucide-react';

const FraudQueuePage = () => {
  const { claims, updateClaimStatus } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const allCases = claims.filter(c => c.status === 'FRAUD_CHECK');

  // Add mock data if there are no fraud cases
  const suspiciousClaims = allCases.length > 0 ? allCases : [
    { id: 'sim-c-1234', workerName: 'Rahul K.', amount: 150, location: 'Indiranagar', riskScore: 89, triggers: ['GPS spoofing detected', 'Velocity matching failure'], timestamp: new Date().toISOString() },
    { id: 'sim-c-1235', workerName: 'Samir D.', amount: 200, location: 'Whitefield', riskScore: 72, triggers: ['Stationary for 40 mins', 'Historical anomaly'], timestamp: new Date().toISOString() },
    { id: 'sim-c-1236', workerName: 'Priya M.', amount: 350, location: 'Koramangala', riskScore: 94, triggers: ['Device mismatch', 'Multiple claims in 1hr'], timestamp: new Date().toISOString() },
  ];

  const filtered = suspiciousClaims.filter(c =>
    (c.workerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskColor = (score) => {
    if (score >= 85) return 'text-risk bg-risk/10 border-risk/20';
    if (score >= 70) return 'text-processing bg-processing/10 border-processing/20';
    return 'text-txt-secondary bg-surface-3 border-bdr';
  };

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="section-title">Fraud Investigation</h1>
          <p className="section-subtitle">AI-flagged claims requiring manual review</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-risk">
            <ShieldAlert size={12} />
            {filtered.length} pending
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 py-2.5 text-sm bg-surface-3"
            placeholder="Search by worker name or claim ID..."
          />
        </div>
        <button className="btn-ghost py-2.5 text-xs">
          <Filter size={14} />
          <span>Filter</span>
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filtered.map((claim, idx) => {
          const riskScore = claim.riskScore || Math.floor(Math.random() * 30 + 60);
          const isExpanded = expandedId === claim.id;

          return (
            <div
              key={idx}
              className="glass-panel overflow-hidden transition-all duration-200"
            >
              {/* Risk indicator stripe */}
              <div className={`h-0.5 ${riskScore >= 85 ? 'bg-risk' : riskScore >= 70 ? 'bg-processing' : 'bg-surface-3'}`}></div>

              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Worker Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-3 border border-bdr flex items-center justify-center text-txt-secondary font-bold text-sm">
                        {(claim.workerName || 'W').charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-txt-primary">{claim.workerName || 'Worker'}</div>
                        <div className="text-xs font-mono text-txt-muted">{claim.id}</div>
                      </div>
                      <div className={`badge ${getRiskColor(riskScore)} ml-2`}>
                        <AlertCircle size={10} />
                        Risk: {riskScore}/100
                      </div>
                    </div>

                    {/* Data Grid */}
                    <div className="grid grid-cols-3 gap-6 mt-3">
                      <div>
                        <div className="text-overline text-txt-muted uppercase mb-1">Triggered Rules</div>
                        <div className="space-y-1.5">
                          {(claim.triggers || ['Device mismatch', 'No recent deliveries']).map((t, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-risk/80">
                              <div className="w-1.5 h-1.5 rounded-full bg-risk shrink-0"></div>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-overline text-txt-muted uppercase mb-1">Claim Value</div>
                        <div className="text-headline text-txt-primary">₹{claim.amount}</div>
                      </div>
                      <div>
                        <div className="text-overline text-txt-muted uppercase mb-1">Location</div>
                        <div className="text-sm font-medium text-txt-primary">{claim.location || 'Bangalore, South'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex md:flex-col gap-2 md:ml-4 shrink-0 md:border-l border-bdr md:pl-4">
                    <button className="btn-success py-2 text-xs flex-1 md:flex-initial">
                      <CheckCircle2 size={14} />
                      <span>Approve</span>
                    </button>
                    <button className="btn-danger py-2 text-xs flex-1 md:flex-initial">
                      <Trash2 size={14} />
                      <span>Reject</span>
                    </button>
                    <button className="btn-ghost py-2 text-xs flex-1 md:flex-initial">
                      <FileSearch size={14} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="glass-panel p-16 flex flex-col items-center text-center">
            <ShieldAlert size={40} className="text-txt-muted mb-3 opacity-30" />
            <h3 className="text-title text-txt-secondary">No fraud cases found</h3>
            <p className="text-body text-txt-muted mt-1">
              {searchQuery ? 'Try a different search query' : 'Simulate a storm to generate fraud checks'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudQueuePage;
