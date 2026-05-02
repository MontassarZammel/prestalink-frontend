import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('prestalink-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch (_) {}
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('prestalink-auth');
      if (!window.location.pathname.includes('/admin')) {
        // silent logout
      }
    }
    return Promise.reject(error);
  }
);

export default api;
