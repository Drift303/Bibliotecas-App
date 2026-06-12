import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

interface Student {
  id: number;
  matricula: string;
  name: string;
  email: string;
  status: string;
}

export default function Students() {
  const [search, setSearch] = useState("");

  const [students] = useState<Student[]>([
    {
      id: 1,
      matricula: "A001",
      name: "Juan Pérez",
      email: "juan@gmail.com",
      status: "Activo",
    },
    {
      id: 2,
      matricula: "A002",
      name: "Ana López",
      email: "ana@gmail.com",
      status: "Activo",
    },
    {
      id: 3,
      matricula: "A003",
      name: "Carlos Ruiz",
      email: "carlos@gmail.com",
      status: "Inactivo",
    },
  ]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.matricula.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewStudent = () => {
    alert("Formulario de nuevo alumno");
  };

  const handleEdit = (id: number) => {
    alert(`Editar alumno ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar este alumno?"
    );

    if (confirmDelete) {
      alert(`Alumno ${id} eliminado`);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Alumnos Registrados
        </h1>

        <button
          onClick={handleNewStudent}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          + Nuevo Alumno
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar alumno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">Matrícula</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Correo</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b hover:bg-slate-50"
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

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      student.status === "Activo"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>

                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(student.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(student.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </DashboardLayout>
  );
}