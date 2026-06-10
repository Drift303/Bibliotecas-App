import DashboardLayout from "../components/DashboardLayout";

export default function Inventory() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Inventario
      </h1>

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">ISBN</th>
              <th className="text-left p-2">Título</th>
              <th className="text-left p-2">Autor</th>
              <th className="text-left p-2">Categoría</th>
              <th className="text-left p-2">Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="p-2">978123456</td>
              <td className="p-2">React Básico</td>
              <td className="p-2">Juan Pérez</td>
              <td className="p-2">Programación</td>
              <td className="p-2">Disponible</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}