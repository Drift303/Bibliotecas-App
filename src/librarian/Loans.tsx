import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

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
      <h1 className="text-4xl font-bold mb-8 text-[#1E3A5F]">
        Historial de Préstamos
      </h1>

      {statusMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 font-medium">
          {statusMessage}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Préstamos Activos" value={activeLoansCount} tone="text-[#1E3A5F]" />
        <SummaryCard label="Préstamos Vencidos" value={expiredLoansCount} tone="text-red-600" />
        <SummaryCard label="Multas Pendientes" value={money.format(totalFines)} tone="text-[#D4A017]" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1E3A5F] text-white">
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Prestado</th>
              <th className="p-3 text-left">Vence</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b hover:bg-[#F8F9FB] transition-colors duration-200">
                <td className="p-3 font-medium text-gray-800">{loan.student}</td>
                <td className="p-3 text-gray-600">{loan.book}</td>
                <td className="p-3 text-gray-600">{loan.loanDate}</td>
                <td className="p-3 text-gray-600">{loan.dueDate}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass(loan.status)}`}>
                    {loan.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {/* REQUERIMIENTO: Botón devolución SOLO en préstamos activos */}
                  {loan.status === "Activo" ? (
                    <button
                      onClick={() => initiateReturnFlow(loan)}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      Devolver
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm italic">—</span>
                  )}
                </td>
              </tr>
            ))}

            {!loading && loans.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                  No hay préstamos registrados.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                  Cargando préstamos...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* REQUERIMIENTO: Modal de devolución con overlay oscuro y tarjeta centrada */}
      {activeReturn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-5 border-b pb-2">
              Procesar Devolución
            </h2>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">Alumno:</span> {activeReturn.student}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">Libro:</span> {activeReturn.book}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">Multa acumulada:</span>{" "}
                <span className={activeReturn.fine > 0 ? "text-red-600 font-bold" : "text-green-600 font-semibold"}>
                  {money.format(activeReturn.fine)}
                </span>
              </p>
            </div>

            {/* Selector de estado físico */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado Físico del Libro al Entregar:
              </label>
              <select
                value={bookCondition}
                onChange={(e) => setBookCondition(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-300 focus:border-[#1E3A5F] transition"
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
                className="w-1/2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingReturn}
                onClick={submitReturn}
                className="w-1/2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
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

function statusClass(status: Loan["status"]) {
  if (status === "Activo") return "bg-green-100 text-green-700";
  if (status === "Vencido") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB]">
      <h2 className="text-sm font-medium text-gray-500 mb-1">{label}</h2>
      <p className={`text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}