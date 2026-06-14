export default function Credential() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">

      <div className="bg-white w-96 rounded-xl shadow-lg p-6">

        <div className="flex flex-col items-center">

          <div className="w-24 h-24 rounded-full bg-slate-300 mb-4"></div>

          <h2 className="text-xl font-bold">
            Juan Pérez
          </h2>

          <p className="text-gray-500">
            Alumno
          </p>

        </div>

        <div className="mt-6 space-y-3">

          <div>
            <span className="font-semibold">
              Matrícula:
            </span>{" "}
            A001
          </div>

          <div>
            <span className="font-semibold">
              Correo:
            </span>{" "}
            juan@escuela.edu
          </div>

          <div>
            <span className="font-semibold">
              Escuela:
            </span>{" "}
            Instituto Central
          </div>

        </div>

        <div className="mt-6 flex justify-center">

          <div className="w-32 h-32 bg-slate-300 rounded">
            QR
          </div>

        </div>

        <button
          className="w-full mt-6 bg-blue-700 text-white py-2 rounded"
        >
          Descargar PDF
        </button>

      </div>

    </div>
  );
}