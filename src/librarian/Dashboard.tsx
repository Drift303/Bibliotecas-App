import DashboardLayout from "../components/DashboardLayout";

export default function Dashboard() {
  const stats = {
    books: 250,
    activeLoans: 34,
    students: 120,
    pendingFines: 120,
  };

  const recentLoans = [
    {
      id: 1,
      student: "Juan Pérez",
      book: "Clean Code",
      status: "Prestado",
    },
    {
      id: 2,
      student: "Ana López",
      book: "Learning React",
      status: "Devuelto",
    },
    {
      id: 3,
      student: "Carlos Ruiz",
      book: "JavaScript",
      status: "Vencido",
    },
  ];

  return (
    <DashboardLayout>
      <div className="bg-[#F8F9FB] min-h-screen">

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#0F172A]">
            Dashboard
          </h1>

          <p className="text-[#6B7280] mt-2">
            Resumen general del sistema bibliotecario.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Libros */}
          <div
            className="
            bg-white
            rounded-2xl
            p-6
            border
            border-[#E5E7EB]
            shadow-sm
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            cursor-pointer
          "
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#6B7280] text-sm">
                  Total de Libros
                </p>

                <h2 className="text-4xl font-bold text-[#1E3A5F] mt-2">
                  {stats.books}
                </h2>
              </div>

              <div
                className="
                w-14
                h-14
                rounded-xl
                bg-blue-100
                flex
                items-center
                justify-center
                text-2xl
              "
              >
                📚
              </div>
            </div>
          </div>

          {/* Préstamos */}
          <div
            className="
            bg-white
            rounded-2xl
            p-6
            border
            border-[#E5E7EB]
            shadow-sm
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            cursor-pointer
          "
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#6B7280] text-sm">
                  Préstamos Activos
                </p>

                <h2 className="text-4xl font-bold text-[#22C55E] mt-2">
                  {stats.activeLoans}
                </h2>
              </div>

              <div
                className="
                w-14
                h-14
                rounded-xl
                bg-green-100
                flex
                items-center
                justify-center
                text-2xl
              "
              >
                🔄
              </div>
            </div>
          </div>

          {/* Alumnos */}
          <div
            className="
            bg-white
            rounded-2xl
            p-6
            border
            border-[#E5E7EB]
            shadow-sm
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            cursor-pointer
          "
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#6B7280] text-sm">
                  Alumnos Registrados
                </p>

                <h2 className="text-4xl font-bold text-[#3B82F6] mt-2">
                  {stats.students}
                </h2>
              </div>

              <div
                className="
                w-14
                h-14
                rounded-xl
                bg-blue-100
                flex
                items-center
                justify-center
                text-2xl
              "
              >
                👨‍🎓
              </div>
            </div>
          </div>

          {/* Multas */}
          <div
            className="
            bg-white
            rounded-2xl
            p-6
            border
            border-[#E5E7EB]
            shadow-sm
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            cursor-pointer
          "
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#6B7280] text-sm">
                  Multas Pendientes
                </p>

                <h2 className="text-4xl font-bold text-[#D4A017] mt-2">
                  ${stats.pendingFines}
                </h2>
              </div>

              <div
                className="
                w-14
                h-14
                rounded-xl
                bg-yellow-100
                flex
                items-center
                justify-center
                text-2xl
              "
              >
                💰
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div
          className="
          mt-8
          bg-white
          rounded-2xl
          border
          border-[#E5E7EB]
          shadow-sm
          overflow-hidden
        "
        >
          <div className="p-5 border-b border-[#E5E7EB]">
            <h2 className="text-xl font-semibold text-[#1E3A5F]">
              Actividad Reciente
            </h2>
          </div>

          <table className="w-full">

            <thead className="bg-[#F8F9FB]">
              <tr>
                <th className="text-left p-4 text-[#475569]">
                  Alumno
                </th>

                <th className="text-left p-4 text-[#475569]">
                  Libro
                </th>

                <th className="text-left p-4 text-[#475569]">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>

              {recentLoans.map((loan) => (
                <tr
                  key={loan.id}
                  className="
                    border-t
                    border-[#E5E7EB]
                    hover:bg-[#F8F9FB]
                    transition-colors
                    duration-200
                  "
                >
                  <td className="p-4">
                    {loan.student}
                  </td>

                  <td className="p-4">
                    {loan.book}
                  </td>

                  <td className="p-4">

                    {loan.status === "Prestado" && (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                        Prestado
                      </span>
                    )}

                    {loan.status === "Devuelto" && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        Devuelto
                      </span>
                    )}

                    {loan.status === "Vencido" && (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                        Vencido
                      </span>
                    )}

                  </td>
                </tr>
              ))}

            </tbody>

          </table>
        </div>

      </div>
    </DashboardLayout>
  );
}