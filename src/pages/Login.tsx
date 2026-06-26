<<<<<<< HEAD
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
=======
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
<<<<<<< HEAD

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          identifier: email,
          password,
        },
        {
          withCredentials: true,
        }
      );

      const role = res.data.user.role;

      localStorage.setItem("role", role);

      if (role === "student") {
        navigate("/catalog");
      } else if (role === "librarian") {
        navigate("/dashboard");
      } else if (
        role === "admin_plantel" ||
        role === "superadmin"
      ) {
        navigate("/schools");
      }
    } catch (err) {
      setError("Credenciales incorrectas");
=======
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authMessage = sessionStorage.getItem("authMessage");
    if (authMessage) {
      setError(authMessage);
      sessionStorage.removeItem("authMessage");
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Escribe tu correo y contrasena");
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
      if (status === 401) {
        setError("Correo o contrasena incorrectos");
      } else if (status === 403) {
        setError("La escuela o cuenta no esta activa");
      } else {
        setError("Sin conexion al servidor");
      }
    } finally {
      setLoading(false);
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Biblioteca Inteligente
        </h1>

        {error && (
          <p className="text-red-500 text-center mb-4">
            {error}
          </p>
        )}

        <input
          type="email"
<<<<<<< HEAD
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
=======
          placeholder="nombre@escuela.edu.mx"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
          className="w-full border p-2 rounded mb-4"
        />

        <input
          type="password"
<<<<<<< HEAD
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
=======
          placeholder="Contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
          className="w-full border p-2 rounded mb-4"
        />

        <button
          onClick={handleLogin}
<<<<<<< HEAD
          className="w-full bg-blue-700 text-white p-2 rounded"
        >
          Iniciar Sesión
=======
          disabled={loading}
          className="w-full bg-blue-700 text-white p-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Iniciar Sesion"}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
        </button>

        <p className="text-center mt-4 text-sm text-gray-500">
          Si necesitas acceso, solicita una cuenta al bibliotecario o
<<<<<<< HEAD
          administrador de tu institución.
=======
          administrador de tu institucion.
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
        </p>
      </div>
    </div>
  );
}
