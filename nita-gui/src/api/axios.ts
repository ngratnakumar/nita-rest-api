import axios from 'axios';

// For local development, use localhost:8000
// For production on 192.168.110.2, make sure backend is running on that domain
const api = axios.create({
  baseURL: 'http://localhost:8000/api',  // Change to https://192.168.110.2/api for production
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