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
  dueDate?: string;
  status: "Activo" | "Vencido" | "Devuelto";
}

interface DueTodayLoan {
  id: string;
  studentName: string;
  bookTitle: string;
  tenantType: "SCHOOL" | "PUBLIC_LIBRARY";
  contactEmail: string | null;
  contactPhone: string | null;
  hasUsableEmail: boolean;
  alreadyNotifiedToday: boolean;
  lastReminderSentAt: string | null;
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
  const [dueTodayLoans, setDueTodayLoans] = useState<DueTodayLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [finePerDay, setFinePerDay] = useState(5.0);
  const [savingFine, setSavingFine] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [phoneNoticeId, setPhoneNoticeId] = useState<string | null>(null);
  const [bulkNotifying, setBulkNotifying] = useState(false);
  const [bulkSummary, setBulkSummary] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setStatusMessage("");

        const [booksRes, usersRes, loansRes, settingsRes, dueTodayRes] = await Promise.all([
          api.get("/books"),
          api.get("/users?role=student"),
          api.get("/loans"),
          api.get("/tenants/settings/current").catch(() => ({ data: { data: { finePerDay: 5.0 } } })),
          api.get("/loans/due-today").catch(() => ({ data: { data: [] } })),
        ]);

        const books = Array.isArray(booksRes.data?.data) ? booksRes.data.data : [];
        const students = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
        const loans = Array.isArray(loansRes.data?.data) ? loansRes.data.data : [];
        setDueTodayLoans(Array.isArray(dueTodayRes.data?.data) ? dueTodayRes.data.data : []);

        if (settingsRes.data?.data?.finePerDay !== undefined) {
          setFinePerDay(settingsRes.data.data.finePerDay);
        }

        const activeLoans = loans.filter((loan: any) => loan.status === "ACTIVE");
        const pendingFines = loans.reduce((total: number, loan: any) => total + Number(loan.fineAmount || 0), 0);

        setStats({
          books: books.length,
          activeLoans: activeLoans.length,
          students: students.length,
          pendingFines,
        });

        const mapLoan = (loan: any): LoanItem => {
          const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
          const isOverdue = loan.status === "ACTIVE" && dueDate && dueDate < new Date();
          return {
            id: String(loan.id),
            studentName: loan.user?.name || "Alumno sin nombre",
            bookTitle: loan.book?.title || "Libro sin título",
            dueDate: dueDate ? dueDate.toLocaleDateString("es-MX") : undefined,
            status: loan.status === "RETURNED" ? "Devuelto" : isOverdue ? "Vencido" : "Activo",
          };
        };

        setRecentLoans(loans.slice(0, 5).map(mapLoan));
      } catch (err) {
        setStats({ books: 0, activeLoans: 0, students: 0, pendingFines: 0 });
        setRecentLoans([]);
        setDueTodayLoans([]);
        setStatusMessage("Sin conexión al servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const reloadDueToday = async () => {
    try {
      const res = await api.get("/loans/due-today");
      setDueTodayLoans(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      // si falla el refresh silencioso, se conserva el estado anterior en pantalla
    }
  };

  const handleNotify = async (loan: DueTodayLoan) => {
    if (!loan.hasUsableEmail) {
      // Caso 3: solo hay teléfono, nunca se manda correo automático.
      setPhoneNoticeId(loan.id);
      return;
    }
    setPhoneNoticeId(null);
    setNotifyingId(loan.id);
    try {
      await api.post(`/loans/${loan.id}/remind`);
      await reloadDueToday();
    } catch {
      setStatusMessage("Error enviando el recordatorio");
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setNotifyingId(null);
    }
  };

  const handleNotifyAll = async () => {
    setBulkNotifying(true);
    setBulkSummary("");
    try {
      const res = await api.post("/loans/remind-all-due-today");
      const { sent, skipped } = res.data?.data || { sent: 0, skipped: 0 };
      setBulkSummary(`${sent} enviados, ${skipped} no se pudo${skipped === 1 ? "" : "n"} enviar automáticamente`);
      await reloadDueToday();
    } catch {
      setBulkSummary("No se pudo completar la notificación masiva");
    } finally {
      setBulkNotifying(false);
    }
  };

  const handleSaveFine = async () => {
    setSavingFine(true);
    try {
      await api.put("/tenants/settings/current", { finePerDay });
      setStatusMessage("Multa por día actualizada correctamente");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (e) {
      setStatusMessage("Error al guardar la multa");
    } finally {
      setSavingFine(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 md:p-8 pt-8">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Panel Principal</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          
          <div className="lg:col-span-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-800/50 p-6 h-fit">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Configuración</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Multa por día de atraso (MXN)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={finePerDay}
                  onChange={(e) => setFinePerDay(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-900 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
                <button
                  onClick={handleSaveFine}
                  disabled={savingFine}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {savingFine ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-800/50 overflow-hidden">
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
        
        {dueTodayLoans.length > 0 && (
          <div className="mt-6 bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-2xl rounded-3xl shadow-xl border border-amber-200 dark:border-amber-900/30 overflow-hidden">
            <div className="p-6 border-b border-amber-200 dark:border-amber-900/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">Préstamos que vencen hoy ({dueTodayLoans.length})</h2>
                {bulkSummary && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{bulkSummary}</p>}
              </div>
              <button
                onClick={handleNotifyAll}
                disabled={bulkNotifying || !dueTodayLoans.some((l) => l.hasUsableEmail)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkNotifying ? "Notificando..." : "Notificar a todos los pendientes"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-amber-100/50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Alumno</th>
                    <th className="px-6 py-4">Libro</th>
                    <th className="px-6 py-4">Tipo de plantel</th>
                    <th className="px-6 py-4">Contacto disponible</th>
                    <th className="px-6 py-4">¿Ya notificado?</th>
                    <th className="px-6 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200 dark:divide-amber-900/30">
                  {dueTodayLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors align-top">
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{loan.studentName}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{loan.bookTitle}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {loan.tenantType === "SCHOOL" ? "Escuela" : "Biblioteca pública"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {loan.hasUsableEmail ? (
                          <span>{loan.contactEmail}</span>
                        ) : loan.contactPhone ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{loan.contactPhone}</span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400 italic">Sin contacto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {loan.alreadyNotifiedToday
                          ? `Sí, ${loan.lastReminderSentAt ? new Date(loan.lastReminderSentAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : ""}`
                          : "No"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {loan.hasUsableEmail ? (
                          <button
                            onClick={() => handleNotify(loan)}
                            disabled={notifyingId === loan.id}
                            className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-700 transition disabled:opacity-50"
                          >
                            {notifyingId === loan.id ? "..." : loan.alreadyNotifiedToday ? "Reenviar" : "Notificar"}
                          </button>
                        ) : (
                          <div className="text-xs">
                            <button
                              onClick={() => handleNotify(loan)}
                              className="text-slate-500 dark:text-slate-400 underline decoration-dotted hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              Sin correo
                            </button>
                            {phoneNoticeId === loan.id && (
                              <p className="mt-1 text-slate-600 dark:text-slate-300 font-medium max-w-[220px]">
                                Este usuario no tiene correo de contacto. Contáctalo directamente al {loan.contactPhone || "número no registrado"}.
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
