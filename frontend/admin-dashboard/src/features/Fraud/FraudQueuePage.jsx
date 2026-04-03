import React from 'react';
import { useStore } from '../../store/useStore';
import { ShieldAlert, AlertCircle, FileSearch, Trash2, CheckCircle2 } from 'lucide-react';

const FraudQueuePage = () => {
  const { claims, updateClaimStatus } = useStore();
  const suspiciousClaims = claims.filter(c => c.status === 'FRAUD_CHECK') || [
    // Mock static data if empty
    { id: 'sim-c-1234', workerName: 'Rahul K.', amount: 150, location: 'Indiranagar', riskScore: 89, triggers: ['GPS spoofing detected', 'Velocity matching failure'] },
    { id: 'sim-c-1235', workerName: 'Samir D.', amount: 200, location: 'Whitefield', riskScore: 72, triggers: ['Stationary for 40 mins', 'Historical anomaly'] }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fraud Investigation</h1>
          <p className="text-gray-400 mt-1">AI-flagged claims requiring manual review</p>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center space-x-3 text-risk">
          <ShieldAlert size={20} />
          <span className="font-semibold">{suspiciousClaims.length} cases pending</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {suspiciousClaims.map((claim, idx) => (
          <div key={idx} className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between group overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full w-1 border-l-4 border-risk group-hover:border-processing transition-colors"></div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <div className="text-lg font-bold">{claim.workerName || 'Worker'}</div>
                <div className="text-sm font-mono text-gray-500">{claim.id}</div>
                <div className="status-badge-risk flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>Risk Score: {claim.riskScore || Math.floor(Math.random() * 30 + 60)}/100</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-8 mt-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase mb-1">Triggered Rules</div>
                  <div className="space-y-1 text-sm font-medium">
                    {(claim.triggers || ['Device mismatch', 'No recent deliveries']).map((t, i) => (
                      <div key={i} className="flex items-center space-x-2 text-risk/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-risk"></div>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase mb-1">Claim Value</div>
                  <div className="text-xl font-bold">₹{claim.amount}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase mb-1">Location</div>
                  <div className="text-white font-medium">{claim.location || 'Bangalore, South'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col justify-end space-y-0 space-x-3 md:space-x-0 md:space-y-3 mt-6 md:mt-0 md:ml-6 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <button className="flex items-center space-x-2 px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success hover:text-white transition-colors border border-success/20">
                <CheckCircle2 size={16} />
                <span className="font-semibold text-sm">Force Approve</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-risk/10 text-risk rounded-lg hover:bg-risk hover:text-white transition-colors border border-risk/20">
                <Trash2 size={16} />
                <span className="font-semibold text-sm">Reject Claim</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                <FileSearch size={16} />
                <span className="font-semibold text-sm">Deep Dive</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FraudQueuePage;
