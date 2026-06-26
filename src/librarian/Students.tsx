import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

interface Student {
  id: string | number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  role: string;
}

<<<<<<< HEAD
=======
interface TempPasswordModal {
  name: string;
  email: string;
  tempPassword: string;
}

>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
<<<<<<< HEAD
=======
  const [tempPasswordModal, setTempPasswordModal] = useState<TempPasswordModal | null>(null);
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    role: "student",
  });

<<<<<<< HEAD
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
=======
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users?role=student");
      const studentsList = Array.isArray(res.data.data) ? res.data.data : [];

      setStudents(studentsList);
      setStatusType("ok");
      setStatusMessage(
        studentsList.length > 0
          ? "Datos sincronizados desde el servidor."
          : "Conectado. No hay alumnos registrados."
      );
    } catch (err) {
      setStudents([]);
      setStatusType("error");
      setStatusMessage("Sin conexion al servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const resetForm = () => {
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
    setFormData({
      name: "",
      email: "",
      studentId: "",
      department: "",
      role: "student",
    });
<<<<<<< HEAD
=======
  };

  const handleNewStudent = () => {
    setEditingStudentId(null);
    setActionError("");
    resetForm();
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
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
      role: student.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string | number) => {
<<<<<<< HEAD
    const confirmDelete = window.confirm("¿Deseas eliminar este alumno?");
=======
    const confirmDelete = window.confirm("Deseas eliminar este alumno?");
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${id}`);
      setStudents(students.filter((s) => s.id !== id));
<<<<<<< HEAD
    } catch (err: any) {
      const detail = err?.response?.status
        ? `Error ${err.response.status} al eliminar.`
        : "No se pudo eliminar: sin conexión.";
      alert(detail);
      console.error("Error eliminando alumno:", err);
=======
      setStatusType("ok");
      setStatusMessage("Alumno eliminado correctamente.");
    } catch (err) {
      setStatusType("error");
      setStatusMessage("No se pudo eliminar el alumno");
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
    }
  };

  const handleSaveStudent = async () => {
    if (!formData.name || !formData.email || !formData.studentId) {
<<<<<<< HEAD
      alert("Completa: Nombre, Email, Matrícula");
=======
      setActionError("Completa nombre, correo y matricula");
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
      return;
    }

    setActionError("");

    const payload = {
      name: formData.name,
      email: formData.email,
      studentId: formData.studentId,
<<<<<<< HEAD
      department: formData.department,
=======
      department: formData.department || "General",
      barcode: formData.studentId,
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
      role: "student",
    };

    try {
      if (editingStudentId) {
<<<<<<< HEAD
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
=======
        await api.put(`/users/${editingStudentId}`, payload);
        setShowForm(false);
        await loadStudents();
        return;
      }

      const res = await api.post("/users", payload);
      const newUser = res.data.data;

      if (newUser?.tempPassword) {
        setTempPasswordModal({
          name: newUser.name,
          email: newUser.email,
          tempPassword: newUser.tempPassword,
        });
      }

      setShowForm(false);
      resetForm();
      await loadStudents();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.message || "";

      if (message.includes("email")) {
        setActionError("Ya existe un alumno con ese correo");
      } else if (message.includes("studentId")) {
        setActionError("Ya existe un alumno con esa matricula");
      } else {
        setActionError("No se pudo registrar al alumno");
      }
    }
  };

  const filteredStudents = students.filter((student) => {
    const term = search.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.studentId.toLowerCase().includes(term)
    );
  });
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#1E3A5F]">Alumnos Registrados</h1>
          {statusMessage && (
<<<<<<< HEAD
            <p
              className={`text-sm mt-1 font-medium ${
                statusType === "error"
                  ? "text-red-600"
                  : statusType === "ok"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
=======
            <p className={`text-sm mt-1 font-medium ${statusType === "error" ? "text-red-600" : statusType === "ok" ? "text-green-600" : "text-blue-600"}`}>
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
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
<<<<<<< HEAD
          placeholder="Buscar alumno por nombre, email o matrícula..."
=======
          placeholder="Buscar alumno por nombre, email o matricula..."
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
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
<<<<<<< HEAD
              placeholder="Matrícula"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
=======
              placeholder="Matricula"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
<<<<<<< HEAD
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
=======
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="email"
              placeholder="Correo"
              value={formData.email}
<<<<<<< HEAD
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
=======
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Departamento"
              value={formData.department}
<<<<<<< HEAD
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
=======
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
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
<<<<<<< HEAD
                <th className="p-3 text-left">Matrícula</th>
=======
                <th className="p-3 text-left">Matricula</th>
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Correo</th>
                <th className="p-3 text-left">Depto.</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
<<<<<<< HEAD
                <tr
                  key={student.id}
                  className="border-b hover:bg-[#F8F9FB] transition-colors duration-200"
                >
=======
                <tr key={student.id} className="border-b hover:bg-[#F8F9FB] transition-colors duration-200">
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
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
<<<<<<< HEAD
=======

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                    No hay alumnos para mostrar.
                  </td>
                </tr>
              )}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
            </tbody>
          </table>
        </div>
      )}
<<<<<<< HEAD
    </DashboardLayout>
  );
}
=======

      {tempPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">
              Contrasena temporal
            </h2>
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-sm mb-4">
              Esta es la unica vez que veras esta contrasena. Anotala o compartela ahora con el alumno.
            </p>
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">Alumno:</span> {tempPasswordModal.name}
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-semibold">Correo:</span> {tempPasswordModal.email}
            </p>
            <div className="bg-slate-100 rounded-xl p-4 text-center font-mono text-2xl font-bold tracking-wide mb-4">
              {tempPasswordModal.tempPassword}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(tempPasswordModal.tempPassword)}
                className="flex-1 bg-[#2B6CB0] text-white px-4 py-3 rounded-xl font-semibold"
              >
                Copiar
              </button>
              <button
                onClick={() => setTempPasswordModal(null)}
                className="flex-1 bg-[#1E3A5F] text-white px-4 py-3 rounded-xl font-semibold"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
