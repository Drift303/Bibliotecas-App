import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Loan {
  id: string;
  student: string;
  book: string;
  loanDate: string;
  dueDate: string;
  returnedDate: string | null;
  fine: number;
  status: "Activo" | "Vencido" | "Devuelto";
}

// Interfaz del modal adaptada a los requerimientos
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
  
  // Estado para controlar el modal de flujo de devolución
  const [activeReturn, setActiveReturn] = useState<ReturnModalData | null>(null);
  const [bookCondition, setBookCondition] = useState("Excelente");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setStatusMessage("");
      const res = await api.get("/loans");
      const rawLoans = Array.isArray(res.data?.data) ? res.data.data : [];
      setLoans(rawLoans.map(mapLoan));
    } catch (err) {
      setLoans([]);
      setStatusMessage("No se pudieron cargar los préstamos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  // Abre el modal para configurar la devolución física
  const initiateReturnFlow = (loan: Loan) => {
    setActiveReturn({
      loanId: loan.id,
      student: loan.student,
      book: loan.book,
      fine: loan.fine,
    });
    setBookCondition("Excelente"); // Estado inicial por defecto
  };

  // Procesa formalmente la devolución al backend enviando el estado físico
  const submitReturn = async () => {
    if (!activeReturn) return;
    try {
      setSubmittingReturn(true);
      await api.post(`/loans/${activeReturn.loanId}/return`, {
        condition: bookCondition, // Enviamos el estado físico al backend de Ángel
      });
      setActiveReturn(null);
      loadLoans();
    } catch (err) {
      setStatusMessage("No se pudo registrar la devolución");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const activeLoansCount = loans.filter((loan) => loan.status === "Activo").length;
  const expiredLoansCount = loans.filter((loan) => loan.status === "Vencido").length;
  const totalFines = loans.reduce((total, loan) => total + loan.fine, 0);

  return (
    <DashboardLayout>
      <h1 className={`text-4xl font-bold mb-8 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
        Historial de Préstamos
      </h1>

      {statusMessage && (
        <div
          className={`flex gap-3 items-start p-4 rounded-lg mb-6 font-medium border ${
            isDark
              ? "bg-red-900/20 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          {statusMessage}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Préstamos Activos" value={loans.filter((loan) => loan.status === "Activo").length} isDark={isDark} tone="blue" />
        <SummaryCard label="Préstamos Vencidos" value={loans.filter((loan) => loan.status === "Vencido").length} isDark={isDark} tone="red" />
        <SummaryCard
          label="Multas Pendientes"
          value={money.format(loans.reduce((total, loan) => total + loan.fine, 0))}
          isDark={isDark}
          tone="amber"
        />
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${
          isDark
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        <table className="w-full">
          <thead
            className={`${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-100"
                : "bg-slate-100 border-slate-200 text-slate-900"
            } border-b`}
          >
            <tr>
              <th className="p-3 text-left font-semibold">Alumno</th>
              <th className="p-3 text-left font-semibold">Libro</th>
              <th className="p-3 text-left font-semibold">Prestado</th>
              <th className="p-3 text-left font-semibold">Vence</th>
              <th className="p-3 text-left font-semibold">Estado</th>
              <th className="p-3 text-center font-semibold">Acción</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan, idx) => (
              <tr
                key={loan.id}
                className={`border-b transition-colors ${
                  isDark
                    ? idx % 2 === 0
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "bg-slate-800/50 hover:bg-slate-800"
                    : idx % 2 === 0
                    ? "bg-white hover:bg-slate-50"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                  {loan.student}
                </td>
                <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {loan.book}
                </td>
                <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {loan.loanDate}
                </td>
                <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {loan.dueDate}
                </td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${statusClass(loan.status, isDark)}`}>
                    {loan.status}
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
                    <span className={`text-sm italic ${isDark ? "text-slate-500" : "text-slate-400"}`}>—</span>
                  )}
                </td>
              </tr>
            ))}

            {!loading && loans.length === 0 && (
              <tr>
                <td colSpan={6} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  No hay préstamos registrados.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={6} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Cargando préstamos...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de devolución */}
      {activeReturn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div
            className={`rounded-lg w-full max-w-md p-6 border ${
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-5 pb-2 border-b ${isDark ? "text-white border-slate-700" : "text-[#1E3A5F] border-slate-200"}`}>
              Procesar Devolución
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
                Estado Físico del Libro al Entregar:
              </label>
              <select
                value={bookCondition}
                onChange={(e) => setBookCondition(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:outline-none"
                    : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
                }`}
              >
                <option value="Excelente">Excelente (Como nuevo)</option>
                <option value="Bueno">Bueno (Signos de uso normales)</option>
                <option value="Dañado">Dañado (Requiere penalización/reparación)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={submittingReturn}
                onClick={() => setActiveReturn(null)}
                className={`w-1/2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isDark
                    ? "border border-slate-600 text-slate-300 hover:bg-slate-800"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
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
}

function mapLoan(loan: any): Loan {
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  const isOverdue = loan.status === "ACTIVE" && dueDate && dueDate < new Date();

  return {
    id: String(loan.id),
    student: loan.user?.name || "Alumno sin nombre",
    book: loan.book?.title || "Libro sin título",
    loanDate: formatDate(loan.createdAt),
    dueDate: formatDate(loan.dueDate),
    returnedDate: loan.returnDate ? formatDate(loan.returnDate) : null,
    fine: Number(loan.fineAmount || 0),
    status: loan.status === "RETURNED" ? "Devuelto" : isOverdue ? "Vencido" : "Activo",
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX");
}

function statusClass(status: Loan["status"], isDark: boolean) {
  if (status === "Activo") return isDark ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700";
  if (status === "Vencido") return isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700";
  return isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700";
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
    <div
      className={`p-5 rounded-lg border transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-slate-200"
      }`}
    >
      <h2 className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </h2>
      <p className={`text-3xl font-bold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}