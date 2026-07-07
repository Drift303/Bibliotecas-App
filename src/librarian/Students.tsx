import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, Copy, Check } from "lucide-react";

interface Student {
  id: string | number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  role: string;
}

interface TempPasswordModal {
  name: string;
  email: string;
  tempPassword: string;
}

export default function Students() {
  const { isDark } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const [tempPasswordModal, setTempPasswordModal] = useState<TempPasswordModal | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    role: "student",
  });

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
    setFormData({
      name: "",
      email: "",
      studentId: "",
      department: "",
      role: "student",
    });
  };

  const handleNewStudent = () => {
    setEditingStudentId(null);
    setActionError("");
    resetForm();
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
    const confirmDelete = window.confirm("Deseas eliminar este alumno?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${id}`);
      setStudents(students.filter((s) => s.id !== id));
      setStatusType("ok");
      setStatusMessage("Alumno eliminado correctamente.");
    } catch (err) {
      setStatusType("error");
      setStatusMessage("No se pudo eliminar el alumno");
    }
  };

  const handleSaveStudent = async () => {
    if (!formData.name || !formData.email || !formData.studentId) {
      setActionError("Completa nombre, correo y matricula");
      return;
    }

    setActionError("");

    const payload = {
      name: formData.name,
      email: formData.email,
      studentId: formData.studentId,
      department: formData.department || "General",
      barcode: formData.studentId,
      role: "student",
    };

    try {
      if (editingStudentId) {
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

  const searchStudentLower = search.toLowerCase().trim();
  const exactStudentMatch = students.filter(s => s.studentId && s.studentId.toLowerCase() === searchStudentLower);

  const filteredStudents = exactStudentMatch.length > 0
    ? exactStudentMatch
    : students.filter((student) => {
        return (
          student.name.toLowerCase().includes(searchStudentLower) ||
          student.email.toLowerCase().includes(searchStudentLower) ||
          student.studentId.toLowerCase().includes(searchStudentLower)
        );
      });

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
            Alumnos Registrados
          </h1>
          {statusMessage && (
            <p
              className={`text-sm mt-2 font-medium flex items-center gap-2 ${
                statusType === "error"
                  ? isDark ? "text-red-400" : "text-red-600"
                  : statusType === "ok"
                  ? isDark ? "text-green-400" : "text-green-600"
                  : isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {statusType === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {statusMessage}
            </p>
          )}
        </div>

        <button
          onClick={handleNewStudent}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDark
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-[#1E3A5F] text-white hover:bg-[#2d5a8e]"
          }`}
        >
          <Plus size={20} /> Nuevo Alumno
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar alumno por nombre, email o matricula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
            isDark
              ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              : "bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          }`}
        />
      </div>

      {showForm && (
        <div
          className={`p-6 rounded-lg border mb-6 transition-colors ${
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
            {editingStudentId ? "Editar Alumno" : "Nuevo Alumno"}
          </h2>

          {actionError && (
            <div
              className={`flex gap-3 items-start p-3 rounded-lg mb-4 border ${
                isDark
                  ? "bg-red-900/20 border-red-700 text-red-200"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{actionError}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Matricula"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />

            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />

            <input
              type="email"
              placeholder="Correo"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />

            <input
              type="text"
              placeholder="Departamento"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveStudent}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-all"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Cargando alumnos...
        </div>
      ) : students.length === 0 && statusType === "error" ? (
        <div
          className={`rounded-lg p-6 text-center border ${
            isDark
              ? "bg-red-900/20 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          No se pudieron cargar los alumnos. {statusMessage}
        </div>
      ) : (
        <div
          className={`rounded-lg border overflow-hidden ${
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <table className="w-full">
            <thead
              className={`${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              } border-b`}
            >
              <tr>
                <th className="p-3 text-left font-semibold">Matricula</th>
                <th className="p-3 text-left font-semibold">Nombre</th>
                <th className="p-3 text-left font-semibold">Correo</th>
                <th className="p-3 text-left font-semibold">Depto.</th>
                <th className="p-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`border-b transition-colors ${
                    isDark
                      ? idx % 2 === 0
                        ? "bg-slate-900 hover:bg-slate-800"
                        : "bg-slate-800/50 hover:bg-slate-800"
                      : idx % 2 === 0
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <td className={`p-3 font-mono text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {student.studentId}
                  </td>
                  <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                    {student.name}
                  </td>
                  <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {student.email}
                  </td>
                  <td className={`p-3 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {student.department}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(student.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "text-amber-400 hover:bg-amber-900/30"
                            : "text-amber-600 hover:bg-amber-50"
                        }`}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "text-red-400 hover:bg-red-900/30"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    No hay alumnos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tempPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div
            className={`rounded-lg w-full max-w-md p-6 border ${
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
              Contraseña temporal
            </h2>
            <p
              className={`text-sm rounded-lg p-3 mb-4 flex gap-2 items-start border ${
                isDark
                  ? "bg-red-900/20 border-red-700 text-red-200"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              Esta es la única vez que verás esta contraseña. Anotala o compartela ahora con el alumno.
            </p>
            <p className={`mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <span className="font-semibold">Alumno:</span> {tempPasswordModal.name}
            </p>
            <p className={`mb-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <span className="font-semibold">Correo:</span> {tempPasswordModal.email}
            </p>
            <div
              className={`rounded-lg p-4 text-center font-mono text-2xl font-bold tracking-wide mb-4 border ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              }`}
            >
              {tempPasswordModal.tempPassword}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPasswordModal.tempPassword);
                  setCopiedPassword(true);
                  setTimeout(() => setCopiedPassword(false), 2000);
                }}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  copiedPassword
                    ? isDark ? "bg-green-600 text-white" : "bg-green-100 text-green-700"
                    : isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copiedPassword ? <Check size={18} /> : <Copy size={18} />}
                {copiedPassword ? "Copiado" : "Copiar"}
              </button>
              <button
                onClick={() => setTempPasswordModal(null)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  isDark
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                }`}
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