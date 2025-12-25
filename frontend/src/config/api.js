// Configurazione centralizzata API
// Per uso locale: http://127.0.0.1:8001/api
// Per produzione: inserire URL backend in REACT_APP_API_BASE_URL

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001';
const API_PREFIX = '/api';

export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

export default {
  baseURL: API_BASE_URL,
  apiURL: API_URL,
  timeout: 30000,
};