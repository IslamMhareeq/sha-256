import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const register       = creds => api.post('/register', creds);
export const login          = creds => api.post('/login', creds);
export const forgotPassword = data  => api.post('/forgot-password', data);
export const resetPassword  = data  => api.post('/reset-password', data);

export default api;
