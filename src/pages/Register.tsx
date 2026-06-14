import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow w-[450px]">

        <h1 className="text-2xl font-bold mb-6 text-center">
          Crear Cuenta
        </h1>

        <input
          type="text"
          placeholder="Nombre Completo"
          className="w-full border p-2 rounded mb-4"
        />

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

        <label className="font-medium">
          Rol
        </label>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="student">
            Alumno
          </option>

          <option value="librarian">
            Bibliotecario
          </option>
        </select>

        <button
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          Registrarse
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-3 border p-2 rounded"
        >
          Volver al Login
        </button>

      </div>
    </div>
  );
}
