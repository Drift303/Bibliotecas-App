import DashboardLayout from "../components/DashboardLayout";

export default function QuickLoan() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Registrar Préstamo
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">

        <div className="grid md:grid-cols-2 gap-8">

          {/* Alumno */}
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Información del Alumno
            </h2>

            <input
              type="text"
              placeholder="Matrícula"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="email"
              placeholder="Correo"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Escuela"
              className="w-full border p-2 rounded"
            />

          </div>

          {/* Libro */}
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Información del Libro
            </h2>

            <input
              type="text"
              placeholder="ISBN"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Título"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Autor"
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="Categoría"
              className="w-full border p-2 rounded mb-3"
            />

            <select
              className="w-full border p-2 rounded"
            >
              <option>Disponible</option>
              <option>Prestado</option>
              <option>Mantenimiento</option>
            </select>

          </div>

        </div>

        {/* Datos del préstamo */}

        <div className="mt-8 border-t pt-6">

          <h2 className="text-xl font-semibold mb-4">
            Información del Préstamo
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block mb-1 text-sm text-gray-600">
                Fecha de préstamo
              </label>

              <input
                type="date"
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-600">
                Fecha de devolución
              </label>

              <input
                type="date"
                className="w-full border p-2 rounded"
              />
            </div>

          </div>

          <textarea
            placeholder="Observaciones"
            className="w-full border p-2 rounded mt-4"
            rows={4}
          />
        </div>

        <button
          className="mt-6 bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
        >
          Registrar Préstamo
        </button>

      </div>
    </DashboardLayout>
  );
}