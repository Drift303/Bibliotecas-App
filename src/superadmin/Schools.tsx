import { useTheme } from "../context/ThemeContext";
import LogoutButton from "../components/LogoutButton";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function Schools() {
  const { isDark } = useTheme();
  const userName = localStorage.getItem("userName") || "Administrador";

  const schools = [
    {
      id: 1,
      name: "Instituto Central",
      status: "Activa",
    },
    {
      id: 2,
      name: "Colegio Norte",
      status: "Suspendida",
    },
  ];

  return (
    <div className={`p-6 min-h-screen transition-colors ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? "text-blue-400" : "text-slate-900"}`}>
            Gestión de Escuelas
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Sesión iniciada como {userName}
          </p>
        </div>

        <div className="flex gap-3">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDark
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}>
            <Plus size={18} /> Nueva Escuela
          </button>
          <LogoutButton />
        </div>
      </div>

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
              <th className="p-3 text-left font-semibold">Escuela</th>
              <th className="p-3 text-left font-semibold">Estado</th>
              <th className="p-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {schools.map((school, idx) => (
              <tr
                key={school.id}
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
                <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                  {school.name}
                </td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                      school.status === "Activa"
                        ? isDark
                          ? "bg-green-900/30 text-green-300"
                          : "bg-green-100 text-green-700"
                        : isDark
                        ? "bg-red-900/30 text-red-300"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {school.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
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
          </tbody>
        </table>
      </div>
    </div>
  );
}