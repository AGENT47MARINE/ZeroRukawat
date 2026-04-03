import axios from 'axios';

// Create abstract axios instance for API handling
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.gigshield.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach tokens
api.interceptors.request.use(
  (config) => {
    // const token = useStore.getState().token; // Assuming token is in zustand
    const token = 'mock-jwt-token';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle session expiry
      console.warn('Session expired. Force logout triggered.');
    }
    return Promise.reject(error);
  }
);

// Modular feature-based services
export const ClaimService = {
  getClaims: () => api.get('/claims'),
  updateStatus: (claimId, status) => api.patch(`/claims/${claimId}`, { status }),
  triggerSimulationEvent: (payload) => api.post('/claims/simulate', payload)
};

export const DisruptionService = {
  getActive: () => api.get('/disruptions/active'),
  getHeatmapData: () => api.get('/disruptions/heatmap')
};

export const SystemService = {
  getHealth: () => api.get('/system/health')
};

export default api;
