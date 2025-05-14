import axios from 'axios';
import Cookies from 'js-cookie';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://finance-fusion-api.vercel.app/api' || 'https://localhost:5000/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://finance-fusion-api.vercel.app/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 