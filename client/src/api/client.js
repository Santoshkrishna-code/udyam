import axios from 'axios';

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('udyam_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network or server error occurred';

    // Return detailed error object
    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

export default api;
