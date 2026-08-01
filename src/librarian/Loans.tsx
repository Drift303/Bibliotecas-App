import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { createClientId, readCache, saveCache } from "../offline/db";
import { getPendingLoansCount, queueLoanTransaction, syncPendingLoans } from "../offline/syncLoans";

interface Loan {
  id: string;
  userId: string;
  bookId: string;
  student: string;
  book: string;
  loanDate: string;
  dueDate: string;
  returnedDate: string | null;
  fine: number;
  status: "Activo" | "Vencido" | "Devuelto";
  syncStatus?: "online" | "pending";
}

interface ReturnModalData {
  loanId: string;
  student: string;
  book: string;
  fine: number;
}

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function Loans() {
  const { isDark } = useTheme();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeReturn, setActiveReturn] = useState<ReturnModalData | null>(null);
  const [bookCondition, setBookCondition] = useState("Excelente");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    const updateOnlineState = () => {
      setIsOnline(navigator.onLine);
      refreshPendingCount();
    };

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("offline-sync-queue-changed", refreshPendingCount);
    refreshPendingCount();

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
      window.removeEventListener("offline-sync-queue-changed", refreshPendingCount);
    };
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setStatusMessage("");
      const res = await api.get("/loans");
      const rawLoans = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalizedLoans = rawLoans.map(mapLoan);
      setLoans(normalizedLoans);
      await saveCache("librarianLoans:loans", normalizedLoans);
    } catch (err) {
      const cachedLoans = await readCache<Loan[]>("librarianLoans:loans");
      if (cachedLoans) {
        setLoans(cachedLoans);
        setStatusMessage("Modo offline: mostrando el ultimo historial guardado");
      } else {
        setLoans([]);
        setStatusMessage("No se pudieron cargar los prestamos");
      }
    } finally {
      setLoading(false);
      refreshPendingCount();
    }
  };

  const initiateReturnFlow = (loan: Loan) => {
    setActiveReturn({
      loanId: loan.id,
      student: loan.student,
      book: loan.book,
      fine: loan.fine,
    });
    setBookCondition("Excelente");
  };

  const submitReturn = async () => {
    if (!activeReturn) return;
    const loan = loans.find((item) => item.id === activeReturn.loanId);
    if (!loan) return;

    try {
      setSubmittingReturn(true);
      await api.post(`/loans/${activeReturn.loanId}/return`, {
        condition: bookCondition,
      });
      setActiveReturn(null);
      loadLoans();
    } catch (err: any) {
      const shouldQueueOffline = !err?.response || !navigator.onLine;
      if (!shouldQueueOffline) {
        setStatusMessage("No se pudo registrar la devolucion");
        return;
      }

      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) {
        setStatusMessage("No se pudo guardar offline porque falta el tenant de la sesion");
        return;
      }

      const returnDate = new Date().toISOString();
      await queueLoanTransaction({
        clientId: createClientId("return"),
        tenantId,
        userId: loan.userId,
        bookId: loan.bookId,
        loanId: loan.id,
        returnDate,
        status: "RETURNED",
        condition: bookCondition,
        studentName: loan.student,
        bookTitle: loan.book,
      });

      const nextLoans = loans.map((item) =>
        item.id === loan.id
          ? {
              ...item,
              returnedDate: formatDate(returnDate),
              status: "Devuelto" as const,
              syncStatus: "pending" as const,
            }
          : item
      );
      setLoans(nextLoans);
      await saveCache("librarianLoans:loans", nextLoans);
      setActiveReturn(null);
      setStatusMessage("Devolucion guardada offline. Se sincronizara cuando vuelva internet.");
      refreshPendingCount();
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleManualSync = async () => {
    const result = await syncPendingLoans();
    await refreshPendingCount();
    if (result.error) {
      setStatusMessage(`No se pudo sincronizar: ${result.error}`);
    } else if (result.processed > 0) {
      setStatusMessage(`Se sincronizaron ${result.processed} movimientos pendientes.`);
      loadLoans();
    } else {
      setStatusMessage("No hay movimientos pendientes por sincronizar.");
    }
  };

  const totalFines = loans.reduce((total, loan) => total + loan.fine, 0);

  return (
    <DashboardLayout>
      <h1 className={`text-4xl font-bold mb-8 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
        Historial de Prestamos
      </h1>

      {statusMessage && (
        <div className={`flex gap-3 items-start p-4 rounded-lg mb-6 font-medium border ${isDark ? "bg-red-900/20 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}>
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          {statusMessage}
        </div>
      )}

      <div className={`p-4 rounded-xl mb-6 font-medium border ${connectionClass(isOnline, isDark)}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {isOnline ? "Con conexion" : "Sin conexion: las devoluciones se guardaran offline"}
            {pendingSyncCount > 0 ? ` - ${pendingSyncCount} pendiente(s) de sincronizar` : ""}
          </span>
          {pendingSyncCount > 0 && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={!isOnline}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sincronizar ahora
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Prestamos Activos" value={loans.filter((loan) => loan.status === "Activo").length} isDark={isDark} tone="blue" />
        <SummaryCard label="Prestamos Vencidos" value={loans.filter((loan) => loan.status === "Vencido").length} isDark={isDark} tone="red" />
        <SummaryCard label="Multas Pendientes" value={money.format(totalFines)} isDark={isDark} tone="amber" />
      </div>

      <div className={`rounded-lg border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className={`${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-100 border-slate-200 text-slate-900"} border-b`}>
              <tr>
                <th className="p-3 text-left font-semibold">Alumno</th>
                <th className="p-3 text-left font-semibold">Libro</th>
                <th className="p-3 text-left font-semibold">Prestado</th>
                <th className="p-3 text-left font-semibold">Vence</th>
                <th className="p-3 text-left font-semibold">Estado</th>
                <th className="p-3 text-center font-semibold">Accion</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan, idx) => (
                <tr key={loan.id} className={`border-b transition-colors ${rowClass(idx, isDark)}`}>
                  <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{loan.student}</td>
                  <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{loan.book}</td>
                  <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{loan.loanDate}</td>
                  <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{loan.dueDate}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${loan.syncStatus === "pending" ? "bg-amber-100 text-amber-700" : statusClass(loan.status, isDark)}`}>
                      {loan.syncStatus === "pending" ? "Pendiente sync" : loan.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {loan.status === "Activo" ? (
                      <button
                        onClick={() => initiateReturnFlow(loan)}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-green-700"
                      >
                        Devolver
                      </button>
                    ) : (
                      <span className={`text-sm italic ${isDark ? "text-slate-500" : "text-slate-400"}`}>-</span>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && loans.length === 0 && (
                <tr>
                  <td colSpan={6} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    No hay prestamos registrados.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Cargando prestamos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeReturn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className={`rounded-lg w-full max-w-md p-6 border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
            <h2 className={`text-2xl font-bold mb-5 pb-2 border-b ${isDark ? "text-white border-slate-700" : "text-[#1E3A5F] border-slate-200"}`}>
              Procesar Devolucion
            </h2>

            <div className="space-y-3 mb-6">
              <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                <span className="font-semibold">Alumno:</span> {activeReturn.student}
              </p>
              <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                <span className="font-semibold">Libro:</span> {activeReturn.book}
              </p>
              <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                <span className="font-semibold">Multa acumulada:</span>{" "}
                <span className={activeReturn.fine > 0 ? (isDark ? "text-red-400" : "text-red-600") + " font-bold" : (isDark ? "text-green-400" : "text-green-600") + " font-semibold"}>
                  {money.format(activeReturn.fine)}
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Estado fisico del libro al entregar:
              </label>
              <select
                value={bookCondition}
                onChange={(e) => setBookCondition(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDark ? "bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:outline-none" : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"}`}
              >
                <option value="Excelente">Excelente (Como nuevo)</option>
                <option value="Bueno">Bueno (Signos de uso normales)</option>
                <option value="Danado">Danado (Requiere penalizacion/reparacion)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={submittingReturn}
                onClick={() => setActiveReturn(null)}
                className={`w-1/2 px-4 py-2.5 rounded-lg font-medium transition-all ${isDark ? "border border-slate-600 text-slate-300 hover:bg-slate-800" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingReturn}
                onClick={submitReturn}
                className="w-1/2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {submittingReturn ? "Procesando..." : "Confirmar Entrega"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );

  async function refreshPendingCount() {
    setPendingSyncCount(await getPendingLoansCount());
  }
}

function mapLoan(loan: any): Loan {
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  const isOverdue = loan.status === "ACTIVE" && dueDate && dueDate < new Date();

  return {
    id: String(loan.id),
    userId: String(loan.userId ?? loan.user?.id ?? ""),
    bookId: String(loan.bookId ?? loan.book?.id ?? ""),
    student: loan.user?.name || loan.studentName || "Alumno sin nombre",
    book: loan.book?.title || loan.bookTitle || "Libro sin titulo",
    loanDate: formatDate(loan.createdAt || loan.loanDate),
    dueDate: formatDate(loan.dueDate),
    returnedDate: loan.returnDate ? formatDate(loan.returnDate) : null,
    fine: Number(loan.fineAmount || 0),
    status: loan.status === "RETURNED" ? "Devuelto" : isOverdue ? "Vencido" : "Activo",
    syncStatus: loan.syncStatus || "online",
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX");
}

function rowClass(index: number, isDark: boolean) {
  if (isDark) return index % 2 === 0 ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-800/50 hover:bg-slate-800";
  return index % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100";
}

function statusClass(status: Loan["status"], isDark: boolean) {
  if (status === "Activo") return isDark ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700";
  if (status === "Vencido") return isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700";
  return isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700";
}

function connectionClass(isOnline: boolean, isDark: boolean) {
  if (isOnline) {
    return isDark
      ? "bg-emerald-900/20 border-emerald-700 text-emerald-200"
      : "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  return isDark
    ? "bg-amber-900/20 border-amber-700 text-amber-200"
    : "bg-amber-50 border-amber-200 text-amber-700";
}

function SummaryCard({
  label,
  value,
  isDark,
  tone,
}: {
  label: string;
  value: number | string;
  isDark: boolean;
  tone: "blue" | "red" | "amber";
}) {
  const toneClasses = {
    blue: isDark ? "text-blue-400" : "text-blue-600",
    red: isDark ? "text-red-400" : "text-red-600",
    amber: isDark ? "text-amber-400" : "text-amber-600",
  };

  return (
    <div className={`p-5 rounded-lg border transition-colors ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
      <h2 className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </h2>
      <p className={`text-3xl font-bold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
