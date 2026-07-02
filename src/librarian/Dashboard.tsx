import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { DashboardIcons as Icons } from "../components/icons/DashboardIcons";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";

interface LoanItem {
  id: string;
  studentName: string;
  bookTitle: string;
  status: "Activo" | "Vencido" | "Devuelto";
}

interface DashboardStats {
  books: number;
  activeLoans: number;
  students: number;
  pendingFines: number;
}

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});


export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ books: 0, activeLoans: 0, students: 0, pendingFines: 0 });
  const [recentLoans, setRecentLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setStatusMessage("");

        const [booksRes, usersRes, loansRes] = await Promise.all([
          api.get("/books"),
          api.get("/users?role=student"),
          api.get("/loans"),
        ]);

        const books = Array.isArray(booksRes.data?.data) ? booksRes.data.data : [];
        const students = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
        const loans = Array.isArray(loansRes.data?.data) ? loansRes.data.data : [];

        const activeLoans = loans.filter((loan: any) => loan.status === "ACTIVE");
        const pendingFines = loans.reduce((total: number, loan: any) => total + Number(loan.fineAmount || 0), 0);

        setStats({
          books: books.length,
          activeLoans: activeLoans.length,
          students: students.length,
          pendingFines,
        });

        setRecentLoans(
          loans.slice(0, 5).map((loan: any) => {
            const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
            const isOverdue = loan.status === "ACTIVE" && dueDate && dueDate < new Date();
            
            return {
              id: String(loan.id),
              studentName: loan.user?.name || "Alumno sin nombre",
              bookTitle: loan.book?.title || "Libro sin título",
              status: loan.status === "RETURNED" ? "Devuelto" : isOverdue ? "Vencido" : "Activo",
            };
          })
        );
      } catch (err) {
        setStats({ books: 0, activeLoans: 0, students: 0, pendingFines: 0 });
        setRecentLoans([]);
        setStatusMessage("Sin conexión al servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 md:p-8 pt-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Panel unificado de control bibliotecario.</p>
          {statusMessage && <p className="text-red-500 dark:text-red-400 mt-2 text-sm font-semibold">{statusMessage}</p>}
        </div>

        {/* 4 tarjetas en fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard label="Total de Libros" value={stats.books} tone="text-blue-600 dark:text-blue-400" icon={<Icons.Books className="w-7 h-7 text-blue-600 dark:text-blue-400" />} iconBg="bg-blue-100/50 dark:bg-blue-900/40" />
          <StatCard label="Préstamos Activos" value={stats.activeLoans} tone="text-emerald-600 dark:text-emerald-400" icon={<Icons.Loans className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />} iconBg="bg-emerald-100/50 dark:bg-emerald-900/40" />
          <StatCard label="Alumnos del Plantel" value={stats.students} tone="text-indigo-600 dark:text-indigo-400" icon={<Icons.Students className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />} iconBg="bg-indigo-100/50 dark:bg-indigo-900/40" />
          <StatCard label="Multas Registradas" value={money.format(stats.pendingFines)} tone="text-amber-600 dark:text-amber-400" icon={<Icons.Fines className="w-7 h-7 text-amber-600 dark:text-amber-400" />} iconBg="bg-amber-100/50 dark:bg-amber-900/40" />
        </div>

        <div className="mt-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-800/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Actividad Reciente</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Alumno</th>
                  <th className="px-6 py-4">Libro</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{loan.studentName}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{loan.bookTitle}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}

                {!loading && recentLoans.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">No hay préstamos registrados todavía.</td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">Cargando datos...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
