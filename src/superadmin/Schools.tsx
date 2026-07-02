import { useTheme } from "../context/ThemeContext";
import LogoutButton from "../components/LogoutButton";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";

export default function Schools() {
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
    <div className="relative min-h-screen p-6 transition-colors bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden">
      {/* Elementos decorativos tipo Mac (blurs dinámicos) */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none z-0" />

      <div className="relative z-10">
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Gestión de Escuelas
            </h1>
            <p className="text-sm mt-2 text-slate-500 dark:text-slate-400 font-medium">
              Sesión iniciada como <span className="font-semibold text-slate-700 dark:text-slate-300">{userName}</span>
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <ThemeToggleButton />
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <Plus size={18} /> Nueva Escuela
            </button>
            <LogoutButton />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-800/50 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs border-b border-slate-200/50 dark:border-slate-800/50">
            <tr>
              <th className="px-6 py-4">Escuela</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {schools.map((school, idx) => (
              <tr
                key={school.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  {school.name}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
                      school.status === "Activa"
                        ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                        : "bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50"
                    }`}
                  >
                    {school.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-2 rounded-xl transition-all text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="p-2 rounded-xl transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
    </div>
  );
}