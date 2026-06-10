import DashboardLayout from "../components/DashboardLayout";

export default function Students() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Alumnos
      </h1>

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Matrícula</th>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Correo</th>
              <th className="text-left p-2">Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="p-2">2025001</td>
              <td className="p-2">Juan Pérez</td>
              <td className="p-2">juan@escuela.com</td>
              <td className="p-2">Activo</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}