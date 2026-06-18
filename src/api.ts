import axios from "axios";

// Instancia centralizada de Axios para todo el proyecto
const api = axios.create({
  // URL pública real de tu backend en Railway
  baseURL: "https://loyal-nature-production-26de.up.railway.app/api",
  
  // PERMITIR COOKIES: Clave para que el navegador guarde la sesión de Ana/Luis 
  // y la envíe automáticamente en cada petición a Railway
  withCredentials: true,
  
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor opcional: Por si en el futuro decides cambiar a tokens Bearer (localStorage)
api.interceptors.request.use(
  (config) => {
    // Si necesitas añadir algo a las cabeceras antes de enviar la petición, se hace aquí
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;