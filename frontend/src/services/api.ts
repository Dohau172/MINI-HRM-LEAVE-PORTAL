import axios from 'axios';

const getBaseUrl = (): string => {
  const envUrl = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return (import.meta as ImportMeta & { env: Record<string, string | boolean | undefined> }).env.DEV
    ? '/api'
    : 'https://mini-hrm-leave-portal.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // 60s timeout dự phòng cho Render Free Tier khởi động máy chủ (Cold Start)
});

// Gán Bearer Token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi 401 tự động đăng xuất
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
