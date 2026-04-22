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

  // Simulate Access — visualize o sistema como outro usuário.
  // Não troca o JWT: o backend continua enxergando o usuário real. A simulação
  // vale só pra o lado do cliente (filtros de UI, gates de rota, banner).
  simulatedUser: JSON.parse(localStorage.getItem('erplus_sim_user') || 'null'),
  simulatedPermissions: JSON.parse(localStorage.getItem('erplus_sim_perms') || 'null'),

  simulateAs: async (targetUser) => {
    if (!targetUser) return;
    // Busca a matriz de permissões e extrai apenas o role alvo.
    try {
      const { data } = await api.get('/identity/permissions/');
      const perms = data[targetUser.role] || {};
      localStorage.setItem('erplus_sim_user', JSON.stringify(targetUser));
      localStorage.setItem('erplus_sim_perms', JSON.stringify(perms));
      set({ simulatedUser: targetUser, simulatedPermissions: perms });
    } catch {
      // Se a API falhar, volta ao perfil real.
      get().exitSimulation();
    }
  },

  exitSimulation: () => {
    localStorage.removeItem('erplus_sim_user');
    localStorage.removeItem('erplus_sim_perms');
    set({ simulatedUser: null, simulatedPermissions: null });
  },

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

  // Check permission for a resource.
  // Em modo de simulação, usa a matriz do role simulado.
  can: (resource, action = 'canView') => {
    const { permissions, simulatedPermissions } = get();
    const source = simulatedPermissions || permissions;
    return source[resource]?.[action] ?? false;
  },

  // Retorna o "usuário efetivo" — o simulado se houver, senão o real.
  effectiveUser: () => {
    const { user, simulatedUser } = get();
    return simulatedUser || user;
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
