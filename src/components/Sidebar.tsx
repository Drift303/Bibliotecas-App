import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen">
      <div className="p-4 text-xl font-bold">
        Biblioteca
      </div>

      <nav className="flex flex-col p-4 gap-3">
        <Link to="/dashboard">Dashboard</Link>

        <Link to="/inventory">
          Inventario
        </Link>

        <Link to="/quick-loan">
          Préstamos
        </Link>

        <Link to="/students">
          Alumnos
        </Link>


      </nav>
    </aside>
  );
}