import axios from 'axios';

const api = axios.create({
  baseURL: 'https://192.168.110.2/api', 
  // baseURL: 'http://localhost/api', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});


api.interceptors.request.use((config) => {
    // Make sure this key 'token' matches exactly what you set in Login.tsx
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;