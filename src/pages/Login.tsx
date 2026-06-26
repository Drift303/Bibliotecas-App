import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
          placeholder="nombre@escuela.edu.mx"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          className="w-full border p-2 rounded mb-4"
        />

        <input
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          className="w-full border p-2 rounded mb-4"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-700 text-white p-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Iniciar Sesion"}
        </button>

        <p className="text-center mt-4 text-sm text-gray-500">
          Si necesitas acceso, solicita una cuenta al bibliotecario o
          administrador de tu institucion.
        </p>
      </div>
    </div>
  );
}
