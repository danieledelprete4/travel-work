import axios from 'axios';
import { API_URL } from '../config/api';

// Istanza axios centralizzata con interceptor
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: aggiunge token automaticamente
axiosInstance.interceptors.request.use(
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

// Response interceptor: gestione 401/403
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token scaduto o non valido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else if (error.response.status === 403) {
        // Non autorizzato
        console.error('Accesso negato: permessi insufficienti');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;