import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

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

// Íconos SVG detallados y profesionales para las tarjetas
const Icons = {
  Books: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1E3A5F]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Loans: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#22C55E]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408-.621 3.106a.75.75 0 0 0 1.255.758l2.603-2.113A2.25 2.25 0 0 1 14.364 16H16.5a2.25 2.25 0 0 0 2.25-2.25v-1.5" />
    </svg>
  ),
  Students: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#3B82F6]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A5.906 5.906 0 0 1 12 3.493a5.907 5.907 0 0 1 10.374 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 13.49v-4.187m0 0V3.493m0 5.81L3.064 7.424M12 9.303l8.936-1.879" />
    </svg>
  ),
  Fines: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#D4A017]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.83-1.106-2.171 0-3.001 1.12-.839 2.939-.839 4.058 0 .43.323.753.77.967 1.26" />
    </svg>
  ),
};

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
      <div className="bg-[#F8F9FB] min-h-screen p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">Dashboard</h1>
          <p className="text-[#6B7280] mt-2">Panel unificado de control bibliotecario.</p>
          {statusMessage && <p className="text-red-600 mt-2 text-sm font-medium">{statusMessage}</p>}
        </div>

        {/* 4 tarjetas en fila sin bordes innecesarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total de Libros" value={stats.books} tone="text-[#1E3A5F]" icon={<Icons.Books />} iconBg="bg-blue-50" />
          <StatCard label="Préstamos Activos" value={stats.activeLoans} tone="text-[#22C55E]" icon={<Icons.Loans />} iconBg="bg-green-50" />
          <StatCard label="Alumnos del Plantel" value={stats.students} tone="text-[#3B82F6]" icon={<Icons.Students />} iconBg="bg-blue-50" />
          <StatCard label="Multas Registradas" value={money.format(stats.pendingFines)} tone="text-[#D4A017]" icon={<Icons.Fines />} iconBg="bg-amber-50" />
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB]">
            <h2 className="text-xl font-semibold text-[#1E3A5F]">Actividad Reciente</h2>
          </div>

          <table className="w-full">
            <thead className="bg-[#F8F9FB]">
              <tr>
                <th className="text-left p-4 text-[#475569] font-medium">Alumno</th>
                <th className="text-left p-4 text-[#475569] font-medium">Libro</th>
                <th className="text-left p-4 text-[#475569] font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentLoans.map((loan) => (
                <tr key={loan.id} className="border-t border-[#E5E7EB] hover:bg-[#F8F9FB] transition-colors">
                  <td className="p-4 text-[#334155] font-medium">{loan.studentName}</td>
                  <td className="p-4 text-[#475569]">{loan.bookTitle}</td>
                  <td className="p-4">
                    <StatusBadge status={loan.status} />
                  </td>
                </tr>
              ))}

              {!loading && recentLoans.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 font-medium">No hay préstamos registrados todavía.</td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 font-medium">Cargando datos...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  tone: string;
  icon: React.ReactNode;
  iconBg: string;
}

// Componente modificado para que el número sea notablemente más grande (text-5xl md:text-6xl)
function StatCard({ label, value, tone, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
      <div>
        <p className="text-[#6B7280] text-sm font-medium">{label}</p>
        <h2 className={`text-5xl md:text-6xl font-extrabold mt-2 tracking-tight ${tone}`}>
          {value}
        </h2>
      </div>
      <div className={`p-4 rounded-2xl ${iconBg} flex items-center justify-center shadow-inner`}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LoanItem["status"] }) {
  if (status === "Activo") {
    return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">En préstamo</span>;
  }
  if (status === "Vencido") {
    return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Vencido</span>;
  }
  return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Devuelto</span>;
}