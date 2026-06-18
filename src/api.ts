import axios from "axios";

// Lee la URL del backend desde la variable de entorno de Vite.
// En local (.env): VITE_API_URL=http://localhost:3001
// En Railway (producción): VITE_API_URL=https://loyal-nature-production-26de.up.railway.app
// Si por algún motivo no está definida, cae a producción como último recurso.
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://loyal-nature-production-26de.up.railway.app";

// Instancia centralizada de Axios para todo el proyecto
const api = axios.create({
  baseURL: `${BASE_URL}/api`,

  // PERMITIR COOKIES: necesario para que el navegador guarde la sesión
  // y la envíe automáticamente en cada petición
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor opcional: por si en el futuro se cambia a tokens Bearer (localStorage)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;