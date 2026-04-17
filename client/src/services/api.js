import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erplus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - try refresh, then redirect to login
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh/login endpoints
      if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/refresh')) {
        localStorage.removeItem('erplus_token');
        localStorage.removeItem('erplus_refresh');
        localStorage.removeItem('erplus_user');
        localStorage.removeItem('erplus_perms');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('erplus_refresh');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/identity/refresh', { refreshToken });

        localStorage.setItem('erplus_token', data.token);
        localStorage.setItem('erplus_refresh', data.refreshToken);
        localStorage.setItem('erplus_user', JSON.stringify(data));
        localStorage.setItem('erplus_perms', JSON.stringify(data.permissions || {}));

        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        processQueue(null, data.token);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('erplus_token');
        localStorage.removeItem('erplus_refresh');
        localStorage.removeItem('erplus_user');
        localStorage.removeItem('erplus_perms');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
