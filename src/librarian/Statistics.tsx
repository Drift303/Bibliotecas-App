import DashboardLayout from "../components/DashboardLayout";

export default function Statistics() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Estadísticas
      </h1>

      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-white shadow rounded p-6">
          <h2 className="text-gray-500">
            Libros
          </h2>

          <p className="text-3xl font-bold">
            250
          </p>
        </div>

        <div className="bg-white shadow rounded p-6">
          <h2 className="text-gray-500">
            Alumnos
          </h2>

          <p className="text-3xl font-bold">
            120
          </p>
        </div>

        <div className="bg-white shadow rounded p-6">
          <h2 className="text-gray-500">
            Préstamos
          </h2>

          <p className="text-3xl font-bold">
            34
          </p>
        </div>

        <div className="bg-white shadow rounded p-6">
          <h2 className="text-gray-500">
            Escuelas
          </h2>

          <p className="text-3xl font-bold">
            5
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}