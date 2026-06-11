import DashboardLayout from "../components/DashboardLayout";

export default function Students() {
  const students = [
    {
      id: 1,
      name: "Juan Pérez",
      email: "juan@gmail.com",
      matricula: "A001",
    },
    {
      id: 2,
      name: "Ana López",
      email: "ana@gmail.com",
      matricula: "A002",
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Alumnos Registrados
      </h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">

          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3">Matrícula</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b"
              >
                <td className="p-3">
                  {student.matricula}
                </td>

                <td className="p-3">
                  {student.name}
                </td>

                <td className="p-3">
                  {student.email}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </DashboardLayout>
  );
}