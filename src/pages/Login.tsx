import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import "./Login.css"; // Asegúrate de tener este archivo con la animación 'shake'

// Componente para el nuevo Ícono de Biblioteca Profesional y Detallado (SVG)
const LibraryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-12 h-12 text-blue-800 drop-shadow-md"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
    />
  </svg>
);

// Componente para el ícono de Ojo Abierto
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

// Componente para el ícono de Ojo Oculto
const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.878 9.878"
    />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const authMessage = sessionStorage.getItem("authMessage");
    if (authMessage) {
      setError(authMessage);
      sessionStorage.removeItem("authMessage");
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError("Escribe tu correo y contraseña");
      triggerShake();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", {
        identifier: email,
        password,
      });

      const user = res.data.user;
      const tenant = res.data.tenant;

      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("tenantId", tenant.id);

      if (user.role === "student") {
        navigate("/catalog");
      } else if (user.role === "librarian") {
        navigate("/dashboard");
      } else if (user.role === "admin_plantel" || user.role === "superadmin") {
        navigate("/schools");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const responseError = err?.response?.data?.error;
      const responseErrors = err?.response?.data?.errors;

      if (status === 400) {
        if (responseErrors?.password) {
          setError("La contraseña debe tener al menos 6 caracteres");
        } else {
          setError("Datos ingresados con formato incorrecto");
        }
      } else if (status === 401) {
        if (responseError === "Tenant not recognized for domain") {
          setError("Escuela (dominio) no registrada");
        } else {
          setError("Correo o contraseña incorrectos");
        }
      } else if (status === 403) {
        setError("La escuela o cuenta no está activa");
      } else {
        setError("Sin conexión al servidor");
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    if (formRef.current) {
      formRef.current.classList.add("shake");
      setTimeout(() => {
        formRef.current?.classList.remove("shake");
      }, 500);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-950 dark:to-slate-900 overflow-hidden p-4">
      {/* Elementos decorativos tipo Mac (blurs dinámicos) */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Botón de tema en la esquina superior */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggleButton />
      </div>

      <form
        ref={formRef}
        onSubmit={handleLogin}
        className="relative z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl shadow-slate-300/50 dark:shadow-black/60 border border-white/50 dark:border-slate-800/50 w-full max-w-[420px] transition-transform duration-300 hover:-translate-y-1"
      >
        {/* Sección del Ícono SVG y Título */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-5 p-4 bg-blue-50/50 dark:bg-blue-900/30 rounded-2xl shadow-inner border border-white/40 dark:border-blue-800/30">
            <LibraryIcon />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Biblioteca Inteligente
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Inicia sesión para continuar
          </p>
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-center mb-6 font-semibold animate-pulse bg-red-50/50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
            {error}
          </p>
        )}

        {/* Input Email */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Correo Institucional
          </label>
          <input
            id="email"
            type="email"
            placeholder="nombre@escuela.edu.mx"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            required
          />
        </div>

        {/* Input Contraseña */}
        <div className="mb-8 relative">
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 p-3.5 rounded-xl pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-[40px] text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
          </button>
        </div>

        {/* Botón Iniciar Sesión */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full ${
            loading ? "bg-blue-500 animate-pulse" : "bg-blue-700 hover:bg-blue-800"
          } text-white font-bold py-3.5 rounded-xl transition duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
        >
          {loading ? "Entrando..." : "Iniciar Sesión"}
        </button>

        {/* Texto de Ayuda */}
        <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-4">
          Si necesitas acceso, solicita una cuenta al{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">bibliotecario</span> o{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">administrador</span> de
          tu institución.
        </p>
      </form>
    </div>
  );
}