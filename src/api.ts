import axios from "axios";

// Lee la URL del backend desde la variable de entorno de Vite.
// En local (.env): VITE_API_URL=http://localhost:3001
// En Railway (producción): VITE_API_URL=https://loyal-nature-production-26de.up.railway.app
// Si por algún motivo no está definida, cae a producción como último recurso.
<<<<<<< HEAD
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://loyal-nature-production-26de.up.railway.app";

=======
const rawBaseUrl =
  import.meta.env.VITE_API_URL || "https://loyal-nature-production-26de.up.railway.app";

const BASE_URL = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
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

<<<<<<< HEAD
export default api;
=======
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("tenantId");
      sessionStorage.setItem("authMessage", "Tu sesion expiro. Inicia sesion de nuevo.");

      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
