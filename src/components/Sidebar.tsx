import { Link, useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton";
// Importamos iconos profesionales para tus enlaces
import { 
  LayoutDashboard, 
  Package, 
  UserCheck, 
  Users, 
  History 
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
  const userName = localStorage.getItem("userName") || "Bibliotecario";

  // Agregamos la propiedad 'icon' asignando el componente correspondiente
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/inventory", label: "Inventario", icon: Package },
    { to: "/quick-loan", label: "Préstamo Rápido", icon: UserCheck },
    { to: "/students", label: "Alumnos", icon: Users },
    { to: "/loans", label: "Historial", icon: History },
  ];

  return (
    <aside className="w-64 bg-[#1E3A5F] text-white min-h-screen shadow-xl flex flex-col">
      {/* Header con Ícono + "Biblioteca" + Nombre de usuario */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <BookIcon />
          <span className="text-2xl font-bold tracking-tight">Biblioteca</span>
        </div>
        <div className="text-sm text-white/70 mt-2 truncate font-medium">
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
              className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                isActive
                  ? "bg-blue-100 text-[#1E3A5F] font-bold shadow-md"
                  : "hover:bg-[#3B82F6]/30 hover:translate-x-2 text-white/90"
              }`}
            >
              {/* Renderizamos el icono al lado del texto */}
              <Icon className={`w-5 h-5 ${isActive ? "text-[#1E3A5F]" : "text-blue-400"}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Botón de Cerrar Sesión Rojo al final */}
      <div className="p-4 border-t border-white/20">
        <LogoutButton className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition duration-300 text-center block" />
      </div>
    </aside>
  );
}