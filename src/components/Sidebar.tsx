<<<<<<< HEAD
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1E3A5F] text-white min-h-screen shadow-xl">

      <div className="p-6 text-2xl font-bold border-b border-white/20">
        📚 Biblioteca
      </div>

      <nav className="flex flex-col p-4 gap-3 mt-2">

        <Link
          to="/dashboard"
          className="
            px-4
            py-3
            rounded-xl
            transition-all
            duration-300
            hover:bg-[#3B82F6]
            hover:text-white
            hover:translate-x-2
            hover:shadow-lg
          "
        >
          Dashboard
        </Link>

        <Link
          to="/inventory"
          className="
            px-4
            py-3
            rounded-xl
            transition-all
            duration-300
            hover:bg-[#3B82F6]
            hover:text-white
            hover:translate-x-2
            hover:shadow-lg
          "
        >
          Inventario
        </Link>

        <Link
          to="/quick-loan"
          className="
            px-4
            py-3
            rounded-xl
            transition-all
            duration-300
            hover:bg-[#3B82F6]
            hover:text-white
            hover:translate-x-2
            hover:shadow-lg
          "
        >
          Préstamos
        </Link>

        <Link
          to="/students"
          className="
            px-4
            py-3
            rounded-xl
            transition-all
            duration-300
            hover:bg-[#3B82F6]
            hover:text-white
            hover:translate-x-2
            hover:shadow-lg
          "
        >
          Alumnos
        </Link>

        <Link
          to="/loans"
          className="
            px-4
            py-3
            rounded-xl
            transition-all
            duration-300
            hover:bg-[#3B82F6]
            hover:text-white
            hover:translate-x-2
            hover:shadow-lg
          "
        >
          Historial de Préstamos
        </Link>

      </nav>

    </aside>
  );
}
=======
import { Link, useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton";

export default function Sidebar() {
  const location = useLocation();
  const userName = localStorage.getItem("userName") || "Bibliotecario";

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/inventory", label: "Inventario" },
    { to: "/quick-loan", label: "Prestamo Rapido" },
    { to: "/students", label: "Alumnos" },
    { to: "/loans", label: "Historial" },
  ];

  return (
    <aside className="w-64 bg-[#1E3A5F] text-white min-h-screen shadow-xl flex flex-col">
      <div className="p-6 border-b border-white/20">
        <div className="text-2xl font-bold">Biblioteca</div>
        <div className="text-sm text-white/70 mt-1 truncate">{userName}</div>
      </div>

      <nav className="flex flex-col p-4 gap-3 mt-2 flex-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-3 rounded-xl transition-all duration-300 hover:bg-[#3B82F6] hover:text-white hover:translate-x-2 hover:shadow-lg ${
                isActive ? "bg-blue-100 text-[#1E3A5F] font-semibold" : ""
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
        <LogoutButton className="w-full py-3" />
      </div>
    </aside>
  );
}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
