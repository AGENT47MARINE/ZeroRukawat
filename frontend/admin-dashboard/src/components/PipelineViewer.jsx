import React from 'react';
import { useStore } from '../store/useStore';
import { Check, ShieldAlert, Cpu, Building2 } from 'lucide-react';

const PipelineViewer = () => {
  const { claims } = useStore();
  
  const stages = [
    { id: 'TRIGGERED', label: 'Triggered', icon: <Cpu size={20}/>, color: 'text-ai', bg: 'bg-ai/20', border: 'border-ai/30' },
    { id: 'PROCESSING', label: 'Validating', icon: <Building2 size={20}/>, color: 'text-processing', bg: 'bg-processing/20', border: 'border-processing/30' },
    { id: 'FRAUD_CHECK', label: 'Fraud Shield', icon: <ShieldAlert size={20}/>, color: 'text-risk', bg: 'bg-risk/20', border: 'border-risk/30' },
    { id: 'PAID', label: 'Paid via UPI', icon: <Check size={20}/>, color: 'text-success', bg: 'bg-success/20', border: 'border-success/30' },
  ];

  const counts = stages.reduce((acc, stage) => {
    acc[stage.id] = claims.filter(c => c.status === stage.id).length;
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="flex justify-between items-center w-full">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center group relative z-10 w-1/4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${stage.bg} ${stage.color} border ${stage.border} shadow-lg backdrop-blur transition-all duration-300 group-hover:scale-110`}>
                {stage.icon}
              </div>
              <div className="mt-4 text-center">
                <div className="font-semibold text-white whitespace-nowrap">{stage.label}</div>
                <div className={`mt-1 text-2xl font-bold ${stage.color}`}>
                  {counts[stage.id] || 0}
                </div>
              </div>
            </div>
            
            {index < stages.length - 1 && (
              <div className="flex-1 h-1 bg-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-ai/50 via-processing/50 to-success/50 w-full animate-pulse blur-[1px]"></div>
                {/* Simulated fast streaming particles */}
                <div className="absolute top-0 left-0 h-full w-4 bg-white/80 rounded-full blur-[1px] animate-[slide_1.5s_linear_infinite]"></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(1000%); }
        }
      `}</style>
    </div>
  );
};

export default PipelineViewer;
