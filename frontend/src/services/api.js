// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auth & user management
export const register       = data => api.post('/register', data);
export const login          = data => api.post('/login', data);
export const forgotPassword = data => api.post('/forgot-password', data);
export const resetPassword  = data => api.post('/reset-password', data);

// Admin-only: fetch all users
export const getUsers = () =>
  api.get('/users', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export default api;
