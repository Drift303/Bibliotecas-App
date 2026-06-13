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
  const [students, setStudents] = useState<Student[]>([
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

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingStudentId, setEditingStudentId] =
    useState<number | null>(null);

  const [formData, setFormData] = useState({
    matricula: "",
    name: "",
    email: "",
    status: "Activo",
  });

  const handleNewStudent = () => {
    setEditingStudentId(null);

    setFormData({
      matricula: "",
      name: "",
      email: "",
      status: "Activo",
    });

    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const student = students.find(
      (s) => s.id === id
    );

    if (!student) return;

    setEditingStudentId(id);

    setFormData({
      matricula: student.matricula,
      name: student.name,
      email: student.email,
      status: student.status,
    });

    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar este alumno?"
    );

    if (!confirmDelete) return;

    setStudents(
      students.filter(
        (student) => student.id !== id
      )
    );
  };

  const handleSaveStudent = () => {
    if (
      !formData.matricula ||
      !formData.name ||
      !formData.email
    ) {
      alert("Completa todos los campos");
      return;
    }

    if (editingStudentId) {
      setStudents(
        students.map((student) =>
          student.id === editingStudentId
            ? {
                ...student,
                ...formData,
              }
            : student
        )
      );
    } else {
      const newStudent: Student = {
        id: Date.now(),
        ...formData,
      };

      setStudents([
        ...students,
        newStudent,
      ]);
    }

    setShowForm(false);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      student.email
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      student.matricula
        .toLowerCase()
        .includes(search.toLowerCase())
  );

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
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full border rounded p-2"
        />
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingStudentId
              ? "Editar Alumno"
              : "Nuevo Alumno"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Matrícula"
              value={formData.matricula}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  matricula:
                    e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <input
              type="email"
              placeholder="Correo"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status:
                    e.target.value,
                })
              }
              className="border p-2 rounded"
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>

          </div>

          <div className="flex gap-3 mt-4">

            <button
              onClick={
                handleSaveStudent
              }
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Guardar
            </button>

            <button
              onClick={() =>
                setShowForm(false)
              }
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>

          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">

          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">
                Matrícula
              </th>

              <th className="p-3 text-left">
                Nombre
              </th>

              <th className="p-3 text-left">
                Correo
              </th>

              <th className="p-3 text-left">
                Estado
              </th>

              <th className="p-3 text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map(
              (student) => (
                <tr
                  key={student.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="p-3">
                    {
                      student.matricula
                    }
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
                        student.status ===
                        "Activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {
                        student.status
                      }
                    </span>
                  </td>

                  <td className="p-3 text-center space-x-2">

                    <button
                      onClick={() =>
                        handleEdit(
                          student.id
                        )
                      }
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          student.id
                        )
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>

                  </td>
                </tr>
              )
            )}
          </tbody>

        </table>
      </div>
    </DashboardLayout>
  );
}