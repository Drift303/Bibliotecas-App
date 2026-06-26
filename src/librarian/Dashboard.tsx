import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

interface LoanItem {
  id: string;
  studentName: string;
  bookTitle: string;
  status: string;
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
  const [stats, setStats] = useState<DashboardStats>({
    books: 0,
    activeLoans: 0,
    students: 0,
    pendingFines: 0,
  });
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

        const books = Array.isArray(booksRes.data.data) ? booksRes.data.data : [];
        const students = Array.isArray(usersRes.data.data) ? usersRes.data.data : [];
        const loans = Array.isArray(loansRes.data.data) ? loansRes.data.data : [];

        const activeLoans = loans.filter((loan: any) => loan.status === "ACTIVE");
        const pendingFines = loans.reduce(
          (total: number, loan: any) => total + Number(loan.fineAmount || 0),
          0
        );

        setStats({
          books: books.length,
          activeLoans: activeLoans.length,
          students: students.length,
          pendingFines,
        });

        setRecentLoans(
          loans.slice(0, 5).map((loan: any) => ({
            id: String(loan.id),
            studentName: loan.user?.name || "Alumno sin nombre",
            bookTitle: loan.book?.title || "Libro sin titulo",
            status: loan.status,
          }))
        );
      } catch (err) {
        setStats({ books: 0, activeLoans: 0, students: 0, pendingFines: 0 });
        setRecentLoans([]);
        setStatusMessage("Sin conexion al servidor");
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
          <h1 className="text-4xl font-bold text-[#0F172A]">Dashboard</h1>
          <p className="text-[#6B7280] mt-2">
            Panel unificado de control bibliotecario.
          </p>
          {statusMessage && (
            <p className="text-red-600 mt-2 text-sm font-medium">{statusMessage}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total de Libros" value={stats.books} tone="text-[#1E3A5F]" />
          <StatCard label="Prestamos Activos" value={stats.activeLoans} tone="text-[#22C55E]" />
          <StatCard label="Alumnos del Plantel" value={stats.students} tone="text-[#3B82F6]" />
          <StatCard label="Multas Registradas" value={money.format(stats.pendingFines)} tone="text-[#D4A017]" />
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
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
                <tr key={loan.id} className="border-t border-[#E5E7EB] hover:bg-[#F8F9FB]">
                  <td className="p-4 text-[#334155]">{loan.studentName}</td>
                  <td className="p-4 text-[#334155]">{loan.bookTitle}</td>
                  <td className="p-4">
                    <StatusBadge status={loan.status} />
                  </td>
                </tr>
              ))}

              {!loading && recentLoans.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 font-medium">
                    No hay prestamos registrados todavia.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 font-medium">
                    Cargando datos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
      <p className="text-[#6B7280] text-sm font-medium">{label}</p>
      <h2 className={`text-4xl font-bold mt-2 ${tone}`}>{value}</h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
        En prestamo
      </span>
    );
  }

  return (
    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
      Devuelto
    </span>
  );
}
