import axios from 'axios';

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || !envUrl.trim()) {
    return '/api/v1';
  }
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }
  return `${cleanUrl}/api/v1`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // For httpOnly refresh token cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('runway_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration / refresh automatically without global page redirects
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const hasToken = Boolean(localStorage.getItem('runway_access_token'));
    if (
      error.response?.status === 401 &&
      hasToken &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        localStorage.setItem('runway_access_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('runway_access_token');
        // Do NOT redirect to '/' or clear local application state. Reject promise gracefully.
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
