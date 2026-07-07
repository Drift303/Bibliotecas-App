import { Link, useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import { useTheme } from "../context/ThemeContext";
// Importamos iconos profesionales para tus enlaces
import { 
  LayoutDashboard, 
  Package, 
  UserCheck, 
  Users, 
  History,
  ClipboardCheck
} from "lucide-react";

// CORREGIDO: Ahora el SVG tiene el path para dibujar el libro físico
const BookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6 text-blue-400"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" 
    />
  </svg>
);

export default function Sidebar() {
  const location = useLocation();
  const { isDark } = useTheme();
  const userName = localStorage.getItem("userName") || "Bibliotecario";

  // Agregamos la propiedad 'icon' asignando el componente correspondiente
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/inventory", label: "Inventario", icon: Package },
    { to: "/annual-inventory", label: "Auditoría Anual", icon: ClipboardCheck },
    { to: "/quick-loan", label: "Préstamo Rápido", icon: UserCheck },
    { to: "/students", label: "Alumnos", icon: Users },
    { to: "/loans", label: "Historial", icon: History },
  ];

  return (
    <aside className={`w-64 h-screen sticky top-0 flex flex-col transition-all duration-300 border-r backdrop-blur-2xl overflow-y-auto ${
      isDark ? "bg-slate-950/60 border-slate-800/50 text-slate-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]" : "bg-white/60 border-white/50 text-slate-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    }`}>
      {/* Header con Ícono + "Biblioteca" + Nombre de usuario */}
      <div className={`p-6 border-b transition-colors ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <BookIcon />
          <span className="text-xl font-bold tracking-tight">Biblioteca</span>
        </div>
        <div className={`text-sm mt-2 truncate font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {userName}
        </div>
      </div>

      {/* Navegación - Links activos e inactivos */}
      <nav className="flex flex-col p-4 gap-3 mt-2 flex-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon; // Extraemos el icono dinámico

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm font-medium ${
                isActive
                  ? isDark
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-900 shadow-sm"
                  : isDark
                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {/* Renderizamos el icono al lado del texto */}
              <Icon className={`w-5 h-5 ${isActive ? (isDark ? "text-white" : "text-slate-900") : "text-inherit"}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Botón de Cerrar Sesión Rojo al final */}
      <div className={`p-4 border-t transition-colors mt-auto ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <LogoutButton className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2 border ${
          isDark 
            ? "border-red-900/50 text-red-400 hover:bg-red-950/50" 
            : "border-red-200 text-red-600 hover:bg-red-50"
        }`} />
      </div>
    </aside>
  );
}