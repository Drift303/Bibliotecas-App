"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("alumno");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulación de login
    const usuario = {
      email,
      rol,
    };

    console.log(usuario);

    // Guardar usuario temporalmente
    localStorage.setItem("usuario", JSON.stringify(usuario));

    // Redirección según rol
    switch (rol) {
      case "administrador":
        router.push("/admin");
        break;

      case "bibliotecario":
        router.push("/bibliotecario");
        break;

      case "alumno":
        router.push("/alumno");
        break;

      default:
        router.push("/");
    }
  };

  const roles = [
    {
      id: "administrador",
      nombre: "Administrador",
      descripcion: "Gestiona todo el sistema",
      icono: "👨‍💼",
    },
    {
      id: "bibliotecario",
      nombre: "Bibliotecario",
      descripcion: "Gestiona préstamos y multas",
      icono: "📚",
    },
    {
      id: "alumno",
      nombre: "Alumno",
      descripcion: "Consulta préstamos y reservas",
      icono: "🎓",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-5">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        
        {/* HEADER */}
        <div className="text-center">
        

          <h1 className="text-3xl font-bold text-gray-800">
            Biblioteca Digital
          </h1>

          <p className="text-gray-500 mt-2">
            Sistema de gestión bibliotecaria
          </p>
        </div>

        {/* ROLES */}
        <div className="mt-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tipo de usuario
          </label>

          <div className="grid gap-3">
            {roles.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRol(item.id)}
                className={`border rounded-xl p-3 flex items-center gap-4 transition-all
                ${
                  rol === item.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <span className="text-2xl">{item.icono}</span>

                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">
                    {item.nombre}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {item.descripcion}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          
          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Contraseña
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Iniciar sesión
          </button>
          {/* CREAR CUENTA */}
<div className="text-center">
  <p className="text-sm text-gray-500">
    ¿No tienes cuenta?
  </p>

  <button
    type="button"
    onClick={() => router.push("/registro")}
    className="mt-2 text-blue-600 hover:text-blue-800 font-semibold transition-all"
  >
    Crear cuenta
  </button>
</div>
        </form>
      </div>
    </div>
  );
}