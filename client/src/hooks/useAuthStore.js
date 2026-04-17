import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('erplus_user') || 'null'),
  token: localStorage.getItem('erplus_token') || null,
  refreshToken: localStorage.getItem('erplus_refresh') || null,
  permissions: JSON.parse(localStorage.getItem('erplus_perms') || '{}'),
  isAuthenticated: !!localStorage.getItem('erplus_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/identity/login', { email, password });
      const { token, refreshToken, permissions, ...userData } = data;

      localStorage.setItem('erplus_token', token);
      localStorage.setItem('erplus_refresh', refreshToken);
      localStorage.setItem('erplus_user', JSON.stringify(userData));
      localStorage.setItem('erplus_perms', JSON.stringify(permissions));

      set({
        user: userData,
        token,
        refreshToken,
        permissions,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (err) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      set({ error: message, loading: false });
      return false;
    }
  },

  refreshSession: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;

    try {
      const { data } = await api.post('/identity/refresh', { refreshToken });
      const { token, refreshToken: newRefresh, permissions, ...userData } = data;

      localStorage.setItem('erplus_token', token);
      localStorage.setItem('erplus_refresh', newRefresh);
      localStorage.setItem('erplus_user', JSON.stringify(userData));
      localStorage.setItem('erplus_perms', JSON.stringify(permissions));

      set({ user: userData, token, refreshToken: newRefresh, permissions, isAuthenticated: true });
      return true;
    } catch {
      get().logout();
      return false;
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      await api.post('/identity/logout', { refreshToken });
    } catch {
      // Best effort
    }
    localStorage.removeItem('erplus_token');
    localStorage.removeItem('erplus_refresh');
    localStorage.removeItem('erplus_user');
    localStorage.removeItem('erplus_perms');
    set({ user: null, token: null, refreshToken: null, permissions: {}, isAuthenticated: false });
  },

  // Check permission for a resource
  can: (resource, action = 'canView') => {
    const { permissions } = get();
    return permissions[resource]?.[action] ?? false;
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/identity/me');
      localStorage.setItem('erplus_user', JSON.stringify(data));
      localStorage.setItem('erplus_perms', JSON.stringify(data.permissions || {}));
      set({ user: data, permissions: data.permissions || {} });
    } catch {
      // Silent fail
    }
  },
}));

export default useAuthStore;
