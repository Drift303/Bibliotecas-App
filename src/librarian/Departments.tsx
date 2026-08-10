import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface Department {
  id: string;
  name: string;
  createdAt: string;
}

export default function Departments() {
  const { isDark } = useTheme();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const tenantType = localStorage.getItem("tenantType") || "SCHOOL";

  const [formData, setFormData] = useState({ name: "" });

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/departments");
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setDepartments(list);
      setStatusType("ok");
      setStatusMessage(list.length > 0 ? "Departamentos sincronizados." : "No hay departamentos registrados.");
    } catch (err) {
      setDepartments([]);
      setStatusType("error");
      setStatusMessage("Sin conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantType === "SCHOOL") {
      loadDepartments();
    } else {
      setLoading(false);
    }
  }, [tenantType]);

  if (tenantType !== "SCHOOL") {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-slate-500">
          Esta función no aplica para bibliotecas públicas.
        </div>
      </DashboardLayout>
    );
  }

  const handleNew = () => {
    setEditingId(null);
    setActionError("");
    setFormData({ name: "" });
    setShowForm(true);
  };

  const handleEdit = (id: string) => {
    const dep = departments.find((d) => d.id === id);
    if (!dep) return;
    setEditingId(id);
    setActionError("");
    setFormData({ name: dep.name });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("¿Deseas eliminar este departamento/carrera?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/departments/${id}`);
      setDepartments(departments.filter((d) => d.id !== id));
      setStatusType("ok");
      setStatusMessage("Eliminado correctamente.");
    } catch (err) {
      setStatusType("error");
      setStatusMessage("No se pudo eliminar");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setActionError("Completa el nombre");
      return;
    }

    setActionError("");

    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, { name: formData.name });
      } else {
        await api.post("/departments", { name: formData.name });
      }
      setShowForm(false);
      setFormData({ name: "" });
      await loadDepartments();
    } catch (err: any) {
      setActionError(err?.response?.data?.error || "Error al guardar");
    }
  };

  const filtered = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase().trim()));

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
            Departamentos / Carreras
          </h1>
          {statusMessage && (
            <p className={`text-sm mt-2 font-medium flex items-center gap-2 ${
                statusType === "error" ? isDark ? "text-red-400" : "text-red-600"
                : statusType === "ok" ? isDark ? "text-green-400" : "text-green-600"
                : isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {statusType === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {statusMessage}
            </p>
          )}
        </div>

        <button onClick={handleNew} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-[#1E3A5F] text-white hover:bg-[#2d5a8e]"}`}>
          <Plus size={20} /> Nuevo Departamento
        </button>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" : "bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none"}`} />
      </div>

      {showForm && (
        <div className={`p-6 rounded-lg border mb-6 transition-colors ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
            {editingId ? "Editar Departamento" : "Nuevo Departamento"}
          </h2>

          {actionError && (
            <div className={`flex gap-3 items-start p-3 rounded-lg mb-4 border ${isDark ? "bg-red-900/20 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{actionError}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 max-w-md">
            <input type="text" placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} className={`px-4 py-2 rounded-lg border transition-colors ${isDark ? "bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:outline-none" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"}`} />
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-all">Guardar</button>
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-lg font-medium transition-all ${isDark ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-200 text-slate-900 hover:bg-slate-300"}`}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Cargando...</div>
      ) : (
        <div className={`rounded-lg border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
          <table className="w-full">
            <thead className={`${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-100 border-slate-200 text-slate-900"} border-b`}>
              <tr>
                <th className="p-3 text-left font-semibold">Nombre</th>
                <th className="p-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dep, idx) => (
                <tr key={dep.id} className={`border-b transition-colors ${isDark ? (idx % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50") : (idx % 2 === 0 ? "bg-white" : "bg-slate-50")}`}>
                  <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{dep.name}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(dep.id)} className={`p-2 rounded-lg transition-all ${isDark ? "text-amber-400 hover:bg-amber-900/30" : "text-amber-600 hover:bg-amber-50"}`}><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(dep.id)} className={`p-2 rounded-lg transition-all ${isDark ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50"}`}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={2} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>No hay resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
