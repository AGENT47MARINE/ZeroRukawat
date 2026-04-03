import React from 'react';
import { useStore } from '../store/useStore';
import { Check, ShieldAlert, Cpu, Building2, ArrowRight } from 'lucide-react';

const PipelineViewer = () => {
  const { claims } = useStore();

  const stages = [
    { id: 'TRIGGERED', label: 'Triggered', icon: Cpu, color: 'text-ai', bg: 'bg-ai/10', border: 'border-ai/20', glow: 'shadow-glow-ai' },
    { id: 'PROCESSING', label: 'Validating', icon: Building2, color: 'text-processing', bg: 'bg-processing/10', border: 'border-processing/20', glow: '' },
    { id: 'FRAUD_CHECK', label: 'Fraud Shield', icon: ShieldAlert, color: 'text-risk', bg: 'bg-risk/10', border: 'border-risk/20', glow: '' },
    { id: 'PAID', label: 'Paid via UPI', icon: Check, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', glow: 'shadow-glow-success' },
  ];

  const counts = stages.reduce((acc, stage) => {
    acc[stage.id] = claims.filter(c => c.status === stage.id).length;
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="flex items-center w-full">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const count = counts[stage.id] || 0;
          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center group relative z-10 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stage.bg} ${stage.color} border ${stage.border} ${stage.glow} transition-all duration-300 group-hover:scale-105`}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-caption font-medium text-txt-secondary">{stage.label}</div>
                  <div className={`mt-0.5 text-headline font-bold ${stage.color}`}>
                    {count}
                  </div>
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="flex-1 h-px bg-border relative overflow-hidden mx-2">
                  <div className="absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-ai/40 to-transparent rounded-full animate-slide-particle"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineViewer;
