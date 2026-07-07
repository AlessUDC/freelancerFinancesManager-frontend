import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401/403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const token = localStorage.getItem('token');

      // Solo deslogear en 401 cuando el token existe (sesión realmente expirada/inválida).
      // 403 = permiso denegado (problema del servidor/CORS/multi-tenancy) — NO es sesión expirada.
      if (status === 401 && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/';
        return new Promise(() => { }); // silenciar el error mientras redirige
      }
    }
    return Promise.reject(error);
  }
);

export default api;
