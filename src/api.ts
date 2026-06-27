import axios from "axios";

// Lee la URL del backend desde la variable de entorno de Vite.
const rawBaseUrl =
  import.meta.env.VITE_API_URL || "https://loyal-nature-production-26de.up.railway.app";

// Limpia automáticamente /api finales o barras extras para evitar rutas rotas
const BASE_URL = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

// Instancia centralizada de Axios para todo el proyecto
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // Crucial para mantener la sesión activa mediante cookies
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: si el backend dice que tu sesión expiró (401), limpia y redirige al login
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
      sessionStorage.setItem("authMessage", "Tu sesión expiró. Inicia sesión de nuevo.");

      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;