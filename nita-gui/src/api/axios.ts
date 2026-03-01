import axios from 'axios';

// LAN configuration: Server at 192.168.110.2:8000
const api = axios.create({
  baseURL: 'http://192.168.110.2:8000/api',
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