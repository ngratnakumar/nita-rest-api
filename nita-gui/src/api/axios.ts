import axios from 'axios';

const api = axios.create({
  baseURL: 'https://192.168.110.2/api', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach the Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nita_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;