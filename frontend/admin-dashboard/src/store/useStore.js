import { create } from 'zustand';

export const useStore = create((set) => ({
  // Auth state
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),

  // System metrics
  systemHealth: 99.9,
  queueLength: 142,
  inferenceLatency: 125, // ms
  slaPercentage: 98.4,
  
  // Real-time state
  disruptions: [],
  claims: [],
  fraudQueue: [],
  payouts: [],
  
  // Actions
  addDisruption: (disruption) => set((state) => ({ 
    disruptions: [disruption, ...state.disruptions]
  })),
  
  updateClaimStatus: (id, status) => set((state) => ({
    claims: state.claims.map(c => c.id === id ? { ...c, status } : c)
  })),
  
  triggerSimulation: () => {
    // Generate synthetic spike
    const newDisruptions = Array.from({ length: 5 }).map((_, i) => ({
      id: `sim-d-${Date.now()}-${i}`,
      type: 'RAINFALL_THRESHOLD',
      location: 'Bangalore, Koramangala',
      workersAffected: Math.floor(Math.random() * 500) + 100,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE'
    }));

    const newClaims = Array.from({ length: 20 }).map((_, i) => ({
      id: `sim-c-${Date.now()}-${i}`,
      workerName: `Worker ${Math.floor(Math.random() * 1000)}`,
      amount: Math.floor(Math.random() * 200) + 50,
      status: i % 4 === 0 ? 'FRAUD_CHECK' : 'PROCESSING',
      timestamp: new Date().toISOString()
    }));
    
    set((state) => ({
      queueLength: state.queueLength + 450,
      disruptions: [...newDisruptions, ...state.disruptions].slice(0, 50),
      claims: [...newClaims, ...state.claims].slice(0, 100)
    }));
  }
}));
