"use client";

import { useRouter } from "next/navigation";

export default function BibliotecarioPage() {
  const router = useRouter();

  // DATOS SIMULADOS
  const stats = {
    prestamosActivos: 32,
    reservasPendientes: 14,
    multasPendientes: 7,
    alumnos: 98,
  };

  // PRÉSTAMOS
  const prestamos = [
    {
      id: "PREST-001",
      user_id: "USR-01",
      alumno: "Juan Pérez",
      libro_mongo_id: "LIB-1001",
      fecha_prestamo: "2026-05-20",
      fecha_devolucion: "2026-05-27",
      estado: "activo",
    },
    {
      id: "PREST-002",
      user_id: "USR-02",
      alumno: "María López",
      libro_mongo_id: "LIB-1002",
      fecha_prestamo: "2026-05-10",
      fecha_devolucion: "2026-05-17",
      estado: "vencido",
    },
  ];

  // RESERVAS
  const reservas = [
    {
      id: "RES-001",
      user_id: "USR-03",
      alumno: "Carlos Ruiz",
      libro_mongo_id: "LIB-3001",
      estado: "pendiente",
    },
    {
      id: "RES-002",
      user_id: "USR-04",
      alumno: "Ana Torres",
      libro_mongo_id: "LIB-5002",
      estado: "lista",
    },
  ];

  // MULTAS
  const multas = [
    {
      id: "MULT-001",
      user_id: "USR-02",
      prestamo_id: "PREST-002",
      alumno: "María López",
      monto: "$120",
      pagada: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between shadow-lg">

        <div>
          <h1 className="text-2xl font-bold">
            Panel Bibliotecario
          </h1>

          <p className="text-sm text-gray-300">
            Gestión de préstamos y reservas
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

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Préstamos activos
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.prestamosActivos}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Reservas pendientes
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.reservasPendientes}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Multas pendientes
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.multasPendientes}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Alumnos registrados
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {stats.alumnos}
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <button className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl shadow-md transition">
            Registrar préstamo
          </button>

          <button className="bg-green-600 hover:bg-green-700 text-white p-5 rounded-2xl shadow-md transition">
            Registrar devolución
          </button>

          <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-5 rounded-2xl shadow-md transition">
            Gestionar reservas
          </button>

          <button className="bg-red-500 hover:bg-red-600 text-white p-5 rounded-2xl shadow-md transition">
            Gestionar multas
          </button>
        </div>

        {/* TABLA PRÉSTAMOS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Préstamos
          </h2>

          <table className="w-full min-w-[900px]">

            <thead>
              <tr className="border-b text-left">
                <th className="py-3 text-gray-500">
                  Alumno
                </th>

                <th className="py-3 text-gray-500">
                  user_id
                </th>

                <th className="py-3 text-gray-500">
                  libro_id
                </th>

                <th className="py-3 text-gray-500">
                  Fecha préstamo
                </th>

                <th className="py-3 text-gray-500">
                  Fecha devolución
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
              {prestamos.map((prestamo) => (
                <tr
                  key={prestamo.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-4 font-medium">
                    {prestamo.alumno}
                  </td>

                  <td className="py-4">
                    {prestamo.user_id}
                  </td>

                  <td className="py-4">
                    {prestamo.libro_mongo_id}
                  </td>

                  <td className="py-4">
                    {prestamo.fecha_prestamo}
                  </td>

                  <td className="py-4">
                    {prestamo.fecha_devolucion}
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${
                        prestamo.estado === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {prestamo.estado}
                    </span>
                  </td>

                  <td className="py-4 flex gap-3">
                    <button className="text-blue-600 hover:text-blue-800 font-semibold">
                      Editar
                    </button>

                    <button className="text-green-600 hover:text-green-800 font-semibold">
                      Devolver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* TABLA RESERVAS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Reservas
          </h2>

          <table className="w-full">

            <thead>
              <tr className="border-b text-left">
                <th className="py-3 text-gray-500">
                  Alumno
                </th>

                <th className="py-3 text-gray-500">
                  user_id
                </th>

                <th className="py-3 text-gray-500">
                  libro_id
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
              {reservas.map((reserva) => (
                <tr
                  key={reserva.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-4 font-medium">
                    {reserva.alumno}
                  </td>

                  <td className="py-4">
                    {reserva.user_id}
                  </td>

                  <td className="py-4">
                    {reserva.libro_mongo_id}
                  </td>

                  <td className="py-4 capitalize">
                    {reserva.estado}
                  </td>

                  <td className="py-4 flex gap-3">
                    <button className="text-blue-600 hover:text-blue-800 font-semibold">
                      Aprobar
                    </button>

                    <button className="text-red-600 hover:text-red-800 font-semibold">
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* TABLA MULTAS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Multas
          </h2>

          <table className="w-full">

            <thead>
              <tr className="border-b text-left">
                <th className="py-3 text-gray-500">
                  Alumno
                </th>

                <th className="py-3 text-gray-500">
                  prestamo_id
                </th>

                <th className="py-3 text-gray-500">
                  Monto
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
              {multas.map((multa) => (
                <tr
                  key={multa.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-4 font-medium">
                    {multa.alumno}
                  </td>

                  <td className="py-4">
                    {multa.prestamo_id}
                  </td>

                  <td className="py-4">
                    {multa.monto}
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${
                        multa.pagada
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {multa.pagada ? "Pagada" : "Pendiente"}
                    </span>
                  </td>

                  <td className="py-4">
                    <button className="text-green-600 hover:text-green-800 font-semibold">
                      Marcar pagada
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