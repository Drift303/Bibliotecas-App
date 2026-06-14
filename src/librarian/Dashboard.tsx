import DashboardLayout from "../components/DashboardLayout";

export default function Dashboard() {

  // Luego vendrá del backend
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

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Libros
          </h2>

          <p className="text-3xl font-bold">
            {stats.books}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Préstamos Activos
          </h2>

          <p className="text-3xl font-bold">
            {stats.activeLoans}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Alumnos
          </h2>

          <p className="text-3xl font-bold">
            {stats.students}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Multas Pendientes
          </h2>

          <p className="text-3xl font-bold text-red-600">
            ${stats.pendingFines}
          </p>
        </div>

      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">

        <h2 className="text-xl font-semibold mb-4">
          Actividad Reciente
        </h2>

        <table className="w-full">

          <thead className="border-b">
            <tr>
              <th className="text-left p-2">
                Alumno
              </th>

              <th className="text-left p-2">
                Libro
              </th>

              <th className="text-left p-2">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>

            {recentLoans.map((loan) => (
              <tr
                key={loan.id}
                className="border-b"
              >
                <td className="p-2">
                  {loan.student}
                </td>

                <td className="p-2">
                  {loan.book}
                </td>

                <td className="p-2">
                  {loan.status}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </DashboardLayout>
  );
}