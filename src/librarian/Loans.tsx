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

interface ReturnModal {
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
  const [returnModal, setReturnModal] = useState<ReturnModal | null>(null);

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

  const handleReturn = async (loan: Loan) => {
    try {
      const res = await api.post(`/loans/${loan.id}/return`, {});
      const fineAmount = Number(res.data?.data?.loan?.fineAmount || 0);
      setReturnModal({
        student: loan.student,
        book: loan.book,
        fine: fineAmount,
      });
      loadLoans();
    } catch (err) {
      setStatusMessage("No se pudo registrar la devolución");
    }
  };

  const activeLoans = loans.filter((loan) => loan.status === "Activo").length;
  const expiredLoans = loans.filter((loan) => loan.status === "Vencido").length;
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
        <SummaryCard label="Préstamos Activos" value={activeLoans} tone="text-[#1E3A5F]" />
        <SummaryCard label="Préstamos Vencidos" value={expiredLoans} tone="text-red-600" />
        <SummaryCard label="Multas Pendientes" value={money.format(totalFines)} tone="text-[#D4A017]" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1E3A5F] text-white">
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Préstamo</th>
              <th className="p-3 text-left">Entrega</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Multa</th>
              <th className="p-3 text-center">Acciones</th>
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
                <td className="p-3 font-medium text-gray-800">{money.format(loan.fine)}</td>
                <td className="p-3 text-center">
                  {loan.status !== "Devuelto" && (
                    <button
                      onClick={() => handleReturn(loan)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      Devolver
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {!loading && loans.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                  No hay préstamos registrados.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                  Cargando préstamos...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {returnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">
              Devolución registrada
            </h2>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Alumno:</span> {returnModal.student}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Libro:</span> {returnModal.book}
            </p>
            <p className="text-gray-700 mb-6">
              <span className="font-semibold">Multa:</span> {money.format(returnModal.fine)}
            </p>
            <button
              onClick={() => setReturnModal(null)}
              className="w-full bg-[#1E3A5F] text-white px-4 py-3 rounded-xl font-semibold"
            >
              Entendido
            </button>
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