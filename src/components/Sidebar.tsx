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