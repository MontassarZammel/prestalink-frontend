import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { reconnectSocket } from '../services/socket';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user, isAuthenticated: true });
        setTimeout(reconnectSocket, 50);
        return user;
      },

      register: async (data) => {
        const res = await api.post('/auth/register', data);
        const { token, user } = res.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user, isAuthenticated: true });
        setTimeout(reconnectSocket, 50);
        return user;
      },

      googleLogin: async (accessToken, profile) => {
        const res = await api.post('/auth/google', { access_token: accessToken, profile });
        const { token, user } = res.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user, isAuthenticated: true });
        setTimeout(reconnectSocket, 50);
        return user;
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
        setTimeout(reconnectSocket, 50);
      },

      initAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },
    }),
    { name: 'prestalink-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);

export default useAuthStore;
