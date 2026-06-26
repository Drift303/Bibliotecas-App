"use client";

import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  // DATOS SIMULADOS
  const stats = {
    usuarios: 128,
    prestamos: 54,
    reservas: 21,
    multas: 9,
  };

  const usuarios = [
    {
      id: "1",
      nombre: "Juan Pérez",
      rol: "alumno",
      matricula: "2024001",
      activo: true,
    },
    {
      id: "2",
      nombre: "María López",
      rol: "bibliotecario",
      matricula: "-",
      activo: true,
    },
    {
      id: "3",
      nombre: "Carlos Ruiz",
      rol: "administrador",
      matricula: "-",
      activo: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between shadow-lg">
        
        <div>
          <h1 className="text-2xl font-bold">
            Panel Administrador
          </h1>

          <p className="text-sm text-gray-300">
            Sistema de gestión bibliotecaria
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("usuario");
            router.push("/login");
          }}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
        >
          Cerrar sesión
        </button>
      </header>

      {/* CONTENIDO */}
      <main className="p-8">

        {/* TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* USUARIOS */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Usuarios registrados
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.usuarios}
            </p>
          </div>

          {/* PRÉSTAMOS */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Préstamos activos
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.prestamos}
            </p>
          </div>

          {/* RESERVAS */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Reservas pendientes
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.reservas}
            </p>
          </div>

          {/* MULTAS */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Multas activas
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.multas}
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <button className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl shadow-md transition">
            Crear Usuario
          </button>

          <button className="bg-green-600 hover:bg-green-700 text-white p-5 rounded-2xl shadow-md transition">
            Gestionar Préstamos
          </button>

          <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-5 rounded-2xl shadow-md transition">
            Gestionar Reservas
          </button>

          <button className="bg-red-500 hover:bg-red-600 text-white p-5 rounded-2xl shadow-md transition">
            Gestionar Multas
          </button>
        </div>

        {/* TABLA USUARIOS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Usuarios
            </h2>

            <button
              onClick={() => router.push("/registro")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Nuevo usuario
            </button>
          </div>

          <table className="w-full min-w-[700px]">

            <thead>
              <tr className="border-b text-left">
                <th className="py-3 text-gray-500">
                  Nombre
                </th>

                <th className="py-3 text-gray-500">
                  Rol
                </th>

                <th className="py-3 text-gray-500">
                  Matrícula
                </th>

                <th className="py-3 text-gray-500">
                  Estado
                </th>

                <th className="py-3 text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-4 font-medium text-slate-700">
                    {usuario.nombre}
                  </td>

                  <td className="py-4 capitalize">
                    {usuario.rol}
                  </td>

                  <td className="py-4">
                    {usuario.matricula}
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${
                        usuario.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="py-4 flex gap-3">
                    <button className="text-blue-600 hover:text-blue-800 font-semibold">
                      Editar
                    </button>

                    <button className="text-red-600 hover:text-red-800 font-semibold">
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </main>
    </div>
  );
}