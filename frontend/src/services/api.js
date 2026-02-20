import axios from 'axios';

// Base URL without /api - keep as is
const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const healthAPI = {
  getDashboardData: () => api.get('/api/health/dashboard'),
  logHealthData: (type, data) => api.post('/api/health/log', { type, data }),
  getHealthScore: () => api.get('/api/health/score'),
  getTrends: (period) => api.get(`/api/health/trends?period=${period}`),
  getHealthData: (type, from, to, limit) => {
    let url = '/api/health/data';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (limit) params.append('limit', limit);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return api.get(url);
  },
  
  // Specific health data logging methods
  logActivity: (steps, duration, calories) => 
    api.post('/api/health/log', { type: 'activity', data: { steps, duration, calories } }),
  
  logSleep: (hours, quality) => 
    api.post('/api/health/log', { type: 'sleep', data: { hours, quality } }),
  
  logHydration: (glasses) => 
    api.post('/api/health/log', { type: 'hydration', data: { glasses } }),
  
  logMood: (mood, notes) => 
    api.post('/api/health/log', { type: 'mental', data: { mood, notes } }),
  
  logBloodPressure: (systolic, diastolic) => 
    api.post('/api/health/log', { type: 'blood-pressure', data: { systolic, diastolic } }),

  logHealthData: (type, data) => api.post('/api/health/log', { type, data }),

  // This should be in your healthAPI object
  logPeriod: (startDate, endDate, flow, symptoms, additionalData) => 
    api.post('/api/health/log', { 
      type: 'period', 
      data: { 
        startDate, 
        endDate, 
        flow, 
        symptoms,
        ...additionalData 
      } 
    }),
};

export const aiAPI = {
  // Health insights
  getInsights: () => api.get('/api/ai/insights'),
  
  // Medical report analysis
  analyzeReport: (reportText, reportType) => 
    api.post('/api/ai/analyze-report', { reportText, reportType }),
  
  // Symptom analysis
  analyzeSymptoms: (symptoms) => 
    api.post('/api/ai/analyze-symptoms', { symptoms }),
  
  // Diet plan generation
  getDietPlan: (goals, preferences) => 
    api.post('/api/ai/diet-plan', { goals, preferences }),
  
  // Sleep advice
  getSleepAdvice: () => api.get('/api/ai/sleep-advice'),
  
  // Skin analysis
  analyzeSkin: (description, concerns) => 
    api.post('/api/ai/analyze-skin', { description, concerns }),
  
  // Chat with AI assistant
  chat: (message, conversationHistory) => {
    // Ensure conversation history has only role and content
    const cleanHistory = (conversationHistory || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    return api.post('/api/ai/chat', { 
      message, 
      conversationHistory: cleanHistory 
    });
  },
};

export default api;
