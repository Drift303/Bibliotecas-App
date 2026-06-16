import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://loyal-nature-production-26de.up.railway.app";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, 
        { identifier: email, password },
        { withCredentials: true }
      );
      const role = res.data.user.role;
      localStorage.setItem("role", role);
      if (role === "student") navigate("/catalog");
      else if (role === "librarian") navigate("/dashboard");
      else if (role === "admin_plantel" || role === "superadmin") navigate("/schools");
    } catch (err) {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Biblioteca Inteligente</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <input type="email" placeholder="Correo" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-4" />
        <input type="password" placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded mb-4" />
        <button onClick={handleLogin}
          className="w-full bg-blue-700 text-white p-2 rounded">
          Iniciar Sesión
        </button>
        <p className="text-center mt-4 text-gray-500">¿No tienes cuenta?</p>
        <button onClick={() => navigate("/register")}
          className="w-full mt-2 border border-gray-300 p-2 rounded">
          Crear Cuenta
        </button>
      </div>
    </div>
  );
}