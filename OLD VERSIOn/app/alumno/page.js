"use client";

import { useRouter } from "next/navigation";

export default function AlumnoPage() {
  const router = useRouter();

  // DATOS SIMULADOS
  const alumno = {
    nombre: "Juan Pérez",
    matricula: "2024001",
    rol: "alumno",
  };

  // PRÉSTAMOS DEL ALUMNO
  const prestamos = [
    {
      id: "PREST-001",
      libro_mongo_id: "LIB-1001",
      fecha_prestamo: "2026-05-20",
      fecha_devolucion: "2026-05-27",
      estado: "activo",
    },
    {
      id: "PREST-002",
      libro_mongo_id: "LIB-2005",
      fecha_prestamo: "2026-04-01",
      fecha_devolucion: "2026-04-08",
      estado: "devuelto",
    },
  ];

  // RESERVAS DEL ALUMNO
  const reservas = [
    {
      id: "RES-001",
      libro_mongo_id: "LIB-3001",
      fecha_reserva: "2026-05-23",
      fecha_expira: "2026-05-26",
      estado: "pendiente",
    },
  ];

  // MULTAS DEL ALUMNO
  const multas = [
    {
      id: "MULT-001",
      prestamo_id: "PREST-002",
      monto: "$120",
      motivo: "Entrega tardía",
      pagada: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between shadow-lg">

        <div>
          <h1 className="text-2xl font-bold">
            Panel del Alumno
          </h1>

          <p className="text-sm text-gray-300">
            Consulta de préstamos y reservas
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

        {/* PERFIL */}
        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-2xl font-bold text-slate-800">
            Bienvenido, {alumno.nombre}
          </h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Matrícula
              </p>

              <h3 className="text-lg font-semibold text-slate-800 mt-1">
                {alumno.matricula}
              </h3>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Rol
              </p>

              <h3 className="text-lg font-semibold capitalize text-slate-800 mt-1">
                {alumno.rol}
              </h3>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Estado
              </p>

              <h3 className="text-lg font-semibold text-green-600 mt-1">
                Activo
              </h3>
            </div>

          </div>
        </div>

        {/* TARJETAS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Préstamos activos
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {
                prestamos.filter(
                  (p) => p.estado === "activo"
                ).length
              }
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Reservas activas
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {reservas.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-gray-500 text-sm font-semibold">
              Multas pendientes
            </h2>

            <p className="text-4xl font-bold text-slate-800 mt-3">
              {
                multas.filter(
                  (m) => !m.pagada
                ).length
              }
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">

          <button className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl shadow-md transition">
            Crear reserva
          </button>

          <button className="bg-green-600 hover:bg-green-700 text-white p-5 rounded-2xl shadow-md transition">
            Ver historial
          </button>
        </div>

        {/* TABLA PRÉSTAMOS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Mis préstamos
          </h2>

          <table className="w-full min-w-[800px]">

            <thead>
              <tr className="border-b text-left">

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
              </tr>
            </thead>

            <tbody>
              {prestamos.map((prestamo) => (
                <tr
                  key={prestamo.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-4 font-medium">
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
                          : prestamo.estado === "devuelto"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {prestamo.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* TABLA RESERVAS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Mis reservas
          </h2>

          <table className="w-full min-w-[800px]">

            <thead>
              <tr className="border-b text-left">

                <th className="py-3 text-gray-500">
                  libro_id
                </th>

                <th className="py-3 text-gray-500">
                  Fecha reserva
                </th>

                <th className="py-3 text-gray-500">
                  Fecha expira
                </th>

                <th className="py-3 text-gray-500">
                  Estado
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
                    {reserva.libro_mongo_id}
                  </td>

                  <td className="py-4">
                    {reserva.fecha_reserva}
                  </td>

                  <td className="py-4">
                    {reserva.fecha_expira}
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${
                        reserva.estado === "pendiente"
                          ? "bg-yellow-100 text-yellow-700"
                          : reserva.estado === "lista"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {reserva.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* TABLA MULTAS */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6 overflow-x-auto">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Mis multas
          </h2>

          <table className="w-full min-w-[800px]">

            <thead>
              <tr className="border-b text-left">

                <th className="py-3 text-gray-500">
                  prestamo_id
                </th>

                <th className="py-3 text-gray-500">
                  Monto
                </th>

                <th className="py-3 text-gray-500">
                  Motivo
                </th>

                <th className="py-3 text-gray-500">
                  Estado
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
                    {multa.prestamo_id}
                  </td>

                  <td className="py-4">
                    {multa.monto}
                  </td>

                  <td className="py-4">
                    {multa.motivo}
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
                      {multa.pagada
                        ? "Pagada"
                        : "Pendiente"}
                    </span>
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