import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow w-96">

        <h1 className="text-2xl font-bold mb-6 text-center">
          Biblioteca Inteligente
        </h1>

        <input
          type="email"
          placeholder="Correo"
          className="w-full border p-2 rounded mb-4"
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border p-2 rounded mb-4"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Iniciar Sesión
        </button>

        <p className="text-center mt-4 text-gray-500">
          ¿No tienes cuenta?
        </p>

        <button
          onClick={() => navigate("/register")}
          className="w-full mt-2 border border-gray-300 p-2 rounded hover:bg-gray-100"
        >
          Crear Cuenta
        </button>

      </div>
    </div>
  );
}