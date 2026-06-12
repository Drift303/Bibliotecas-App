import DashboardLayout from "../components/DashboardLayout";

export default function Dashboard() {

  // Luego estos datos vendrán del backend
  const stats = {
    books: 250,
    loans: 34,
    students: 120,
    schools: 5,
  };

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
            Préstamos
          </h2>

          <p className="text-3xl font-bold">
            {stats.loans}
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
            Escuelas
          </h2>

          <p className="text-3xl font-bold">
            {stats.schools}
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}