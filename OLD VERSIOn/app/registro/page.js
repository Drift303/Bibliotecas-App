"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegistroPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    matricula: "",
    email: "",
    password: "",
    rol: "alumno",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);

    // Simulación de registro
    localStorage.setItem("nuevoUsuario", JSON.stringify(formData));

    alert("Cuenta creada correctamente");

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-5">

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Crear Cuenta
          </h1>

          <p className="text-gray-500 mt-2">
            Registro de usuarios de biblioteca
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 mt-8"
        >

          {/* NOMBRE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Nombre
            </label>

            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan"
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* APELLIDO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Apellido
            </label>

            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              placeholder="Pérez"
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* TELÉFONO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Teléfono
            </label>

            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="2221234567"
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* MATRÍCULA */}
          {formData.rol === "alumno" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Matrícula
              </label>

              <input
                type="text"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                placeholder="20240001"
                className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* ROL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Tipo de usuario
            </label>

            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="alumno">
                Alumno
              </option>

              <option value="bibliotecario">
                Bibliotecario
              </option>

              <option value="administrador">
                Administrador
              </option>
            </select>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Correo electrónico
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Crear cuenta
          </button>

          {/* LOGIN */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?
            </p>

           <button
  type="button"
  onClick={() => router.push("/login")}
  className="mt-2 text-blue-600 hover:text-blue-800 font-semibold"
>
  Iniciar sesión
</button>
          </div>
        </form>
      </div>
    </div>
  );
}