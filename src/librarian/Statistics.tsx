import DashboardLayout from "../components/DashboardLayout";

export default function Statistics() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Estadísticas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Libros Prestados
          </h2>

          <p className="text-3xl font-bold">
            120
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Libros Disponibles
          </h2>

          <p className="text-3xl font-bold">
            350
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500">
            Alumnos Activos
          </h2>

          <p className="text-3xl font-bold">
            200
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}