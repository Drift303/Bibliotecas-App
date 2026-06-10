import DashboardLayout from "../components/DashboardLayout";

export default function QuickLoan() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Préstamo Rápido
      </h1>

      <div className="bg-white p-6 rounded shadow">
        <div className="grid md:grid-cols-2 gap-6">
          
          <div>
            <h2 className="font-semibold mb-4">
              Información del Alumno
            </h2>

            <input
              type="text"
              placeholder="Nombre"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Matrícula"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Escuela"
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <h2 className="font-semibold mb-4">
              Información del Libro
            </h2>

            <input
              type="text"
              placeholder="Libro"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="date"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="date"
              className="w-full border p-2 rounded"
            />
          </div>

        </div>

        <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded">
          Registrar Préstamo
        </button>
      </div>
    </DashboardLayout>
  );
}