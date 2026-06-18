import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

interface Student {
  id: string | number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  barcode: string;
  role: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    barcode: "",
    role: "student",
  });

  // --- CARGAR USUARIOS DEL BACKEND ---
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get("/users");
        const rawUsers = res.data?.success ? res.data.data : (res.data || []);
        const studentsList = (Array.isArray(rawUsers) ? rawUsers : []).filter(
          (u: any) => u.role === "student"
        );

        setStudents(studentsList);
        setStatusType("ok");
        setStatusMessage(
          studentsList.length > 0
            ? "Datos sincronizados desde el servidor."
            : "Conectado. No hay alumnos registrados."
        );
      } catch (err: any) {
        setStudents([]);
        setStatusType("error");
        const detail = err?.response?.status
          ? `Error ${err.response.status} al contactar el servidor.`
          : "No se pudo conectar con el servidor.";
        setStatusMessage(detail);
        console.error("Error cargando alumnos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const handleNewStudent = () => {
    setEditingStudentId(null);
    setActionError("");
    setFormData({
      name: "",
      email: "",
      studentId: "",
      department: "",
      barcode: "",
      role: "student",
    });
    setShowForm(true);
  };

  const handleEdit = (id: string | number) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;

    setEditingStudentId(id);
    setActionError("");
    setFormData({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      department: student.department,
      barcode: student.barcode,
      role: student.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string | number) => {
    const confirmDelete = window.confirm("¿Deseas eliminar este alumno?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${id}`);
      setStudents(students.filter((s) => s.id !== id));
    } catch (err: any) {
      const detail = err?.response?.status
        ? `Error ${err.response.status} al eliminar.`
        : "No se pudo eliminar: sin conexión.";
      alert(detail);
      console.error("Error eliminando alumno:", err);
    }
  };

  const handleSaveStudent = async () => {
    if (!formData.name || !formData.email || !formData.studentId) {
      alert("Completa: Nombre, Email, Matrícula");
      return;
    }

    setActionError("");

    const payload = {
      name: formData.name,
      email: formData.email,
      studentId: formData.studentId,
      department: formData.department,
      barcode: formData.barcode,
      role: "student",
    };

    try {
      if (editingStudentId) {
        const res = await api.put(`/users/${editingStudentId}`, payload);
        const saved = res.data?.success ? res.data.data : res.data;

        setStudents(
          students.map((s) =>
            s.id === editingStudentId ? { ...s, ...formData } : s
          )
        );
      } else {
        const res = await api.post("/users", payload);
        const saved = res.data?.success ? res.data.data : res.data;

        if (!saved?.id) {
          throw new Error("El servidor no devolvió un ID válido.");
        }

        const newStudent: Student = {
          id: saved.id,
          ...formData,
        };
        setStudents([...students, newStudent]);
      }

      setShowForm(false);
    } catch (err: any) {
      const detail = err?.response?.status
        ? `Error ${err.response.status}. ${err.response.data?.message || "Revisa los datos."}`
        : err?.message || "Sin conexión con el servidor.";
      setActionError(detail);
      console.error("Error guardando alumno:", err);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#1E3A5F]">Alumnos Registrados</h1>
          {statusMessage && (
            <p
              className={`text-sm mt-1 font-medium ${
                statusType === "error"
                  ? "text-red-600"
                  : statusType === "ok"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {statusMessage}
            </p>
          )}
        </div>

        <button
          onClick={handleNewStudent}
          className="bg-[#1E3A5F] text-white px-5 py-3 rounded-xl transition-all duration-300 hover:bg-[#3B82F6] hover:shadow-lg hover:-translate-y-1"
        >
          + Nuevo Alumno
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar alumno por nombre, email o matrícula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        />
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
            {editingStudentId ? "Editar Alumno" : "Nuevo Alumno"}
          </h2>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {actionError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Matrícula"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="email"
              placeholder="Correo"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Departamento"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Código de barras"
              value={formData.barcode}
              onChange={(e) =>
                setFormData({ ...formData, barcode: e.target.value })
              }
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSaveStudent}
              className="bg-green-600 text-white px-5 py-2 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-5 py-2 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500 animate-pulse">Cargando alumnos...</div>
      ) : students.length === 0 && statusType === "error" ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
          No se pudieron cargar los alumnos. {statusMessage}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1E3A5F] text-white">
              <tr>
                <th className="p-3 text-left">Matrícula</th>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Correo</th>
                <th className="p-3 text-left">Depto.</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b hover:bg-[#F8F9FB] transition-colors duration-200"
                >
                  <td className="p-3 font-mono text-sm">{student.studentId}</td>
                  <td className="p-3 font-medium">{student.name}</td>
                  <td className="p-3 text-gray-600">{student.email}</td>
                  <td className="p-3 text-sm">{student.department}</td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(student.id)}
                      className="bg-[#D4A017] text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}