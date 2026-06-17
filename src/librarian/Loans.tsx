import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

interface Loan {
  id: number;
  studentId: number;
  student: string;

  bookId: number;
  book: string;

  loanDate: string;
  dueDate: string;
  returnedDate: string | null;

  lateDays: number;
  fine: number;

  status: "Activo" | "Vencido" | "Devuelto";
}

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: 1,
      studentId: 1,
      student: "Juan Pérez",

      bookId: 101,
      book: "Clean Code",

      loanDate: "2026-06-01",
      dueDate: "2026-06-08",
      returnedDate: null,

      lateDays: 4,
      fine: 20,

      status: "Vencido",
    },
    {
      id: 2,
      studentId: 2,
      student: "Ana López",

      bookId: 102,
      book: "Learning React",

      loanDate: "2026-06-05",
      dueDate: "2026-06-12",
      returnedDate: "2026-06-11",

      lateDays: 0,
      fine: 0,

      status: "Devuelto",
    },
    {
      id: 3,
      studentId: 3,
      student: "Carlos Ruiz",

      bookId: 103,
      book: "JavaScript Moderno",

      loanDate: "2026-06-10",
      dueDate: "2026-06-17",
      returnedDate: null,

      lateDays: 0,
      fine: 0,

      status: "Activo",
    },
  ]);

  const handleReturn = (id: number) => {
    setLoans(
      loans.map((loan) =>
        loan.id === id
          ? {
              ...loan,
              status: "Devuelto",
              returnedDate: new Date()
                .toISOString()
                .split("T")[0],
              lateDays: 0,
              fine: 0,
            }
          : loan
      )
    );
  };

  const handleView = (id: number) => {
    const loan = loans.find((loan) => loan.id === id);

    if (!loan) return;

    alert(
      `Alumno: ${loan.student}\n\nLibro: ${loan.book}\n\nEstado: ${loan.status}\n\nFecha préstamo: ${loan.loanDate}\n\nFecha límite: ${loan.dueDate}\n\nFecha devolución: ${
        loan.returnedDate || "Pendiente"
      }\n\nDías de retraso: ${loan.lateDays}\n\nMulta: $${loan.fine}`
    );
  };

  const totalFines = loans.reduce(
    (total, loan) => total + loan.fine,
    0
  );

  const activeLoans = loans.filter(
    (loan) => loan.status === "Activo"
  ).length;

  const expiredLoans = loans.filter(
    (loan) => loan.status === "Vencido"
  ).length;

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 text-[#1E3A5F]">
        Historial de Préstamos
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div
          className="
            bg-white
            p-5
            rounded-2xl
            shadow-sm
            border
            border-[#E5E7EB]
          "
        >
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            Préstamos Activos
          </h2>
          <p className="text-3xl font-bold text-[#1E3A5F]">
            {activeLoans}
          </p>
        </div>

        <div
          className="
            bg-white
            p-5
            rounded-2xl
            shadow-sm
            border
            border-[#E5E7EB]
          "
        >
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            Préstamos Vencidos
          </h2>
          <p className="text-3xl font-bold text-red-600">
            {expiredLoans}
          </p>
        </div>

        <div
          className="
            bg-white
            p-5
            rounded-2xl
            shadow-sm
            border
            border-[#E5E7EB]
          "
        >
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            Multas Pendientes
          </h2>
          <p className="text-3xl font-bold text-[#D4A017]">
            ${totalFines}
          </p>
        </div>
      </div>

      <div
        className="
          bg-white
          rounded-2xl
          shadow-sm
          border
          border-[#E5E7EB]
          overflow-hidden
        "
      >
        <table className="w-full">
          <thead className="bg-[#1E3A5F] text-white">
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Préstamo</th>
              <th className="p-3 text-left">Entrega</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Retraso</th>
              <th className="p-3 text-left">Multa</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan) => (
              <tr
                key={loan.id}
                className="
                  border-b
                  hover:bg-[#F8F9FB]
                  transition-colors
                  duration-200
                "
              >
                <td className="p-3 font-medium text-gray-800">
                  {loan.student}
                </td>

                <td className="p-3 text-gray-600">
                  {loan.book}
                </td>

                <td className="p-3 text-gray-600">
                  {loan.loanDate}
                </td>

                <td className="p-3 text-gray-600">
                  {loan.dueDate}
                </td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      loan.status === "Activo"
                        ? "bg-green-100 text-green-700"
                        : loan.status === "Vencido"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {loan.status}
                  </span>
                </td>

                <td className="p-3 text-gray-600">
                  {loan.lateDays} días
                </td>

                <td className="p-3 font-medium text-gray-800">
                  ${loan.fine}
                </td>

                <td className="p-3 text-center space-x-2">
                  {loan.status !== "Devuelto" && (
                    <button
                      onClick={() => handleReturn(loan.id)}
                      className="
                        bg-green-600
                        text-white
                        px-3
                        py-1
                        rounded-lg
                        transition-all
                        duration-300
                        hover:shadow-md
                        hover:-translate-y-1
                      "
                    >
                      Devolver
                    </button>
                  )}

                  <button
                    onClick={() => handleView(loan.id)}
                    className="
                      bg-gray-500
                      text-white
                      px-3
                      py-1
                      rounded-lg
                      transition-all
                      duration-300
                      hover:shadow-md
                      hover:-translate-y-1
                    "
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}