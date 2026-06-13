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
      `Alumno: ${loan.student}

Libro: ${loan.book}

Estado: ${loan.status}

Fecha préstamo: ${loan.loanDate}

Fecha límite: ${loan.dueDate}

Fecha devolución: ${
        loan.returnedDate || "Pendiente"
      }

Días de retraso: ${loan.lateDays}

Multa: $${loan.fine}`
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
      <h1 className="text-3xl font-bold mb-6">
        Historial de Préstamos
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">
            Préstamos Activos
          </h2>

          <p className="text-3xl font-bold">
            {activeLoans}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">
            Préstamos Vencidos
          </h2>

          <p className="text-3xl font-bold text-red-600">
            {expiredLoans}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-gray-500">
            Multas Pendientes
          </h2>

          <p className="text-3xl font-bold text-orange-600">
            ${totalFines}
          </p>
        </div>

      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">
                Alumno
              </th>

              <th className="p-3 text-left">
                Libro
              </th>

              <th className="p-3 text-left">
                Préstamo
              </th>

              <th className="p-3 text-left">
                Entrega
              </th>

              <th className="p-3 text-left">
                Estado
              </th>

              <th className="p-3 text-left">
                Retraso
              </th>

              <th className="p-3 text-left">
                Multa
              </th>

              <th className="p-3 text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>

            {loans.map((loan) => (
              <tr
                key={loan.id}
                className="border-b hover:bg-slate-50"
              >
                <td className="p-3">
                  {loan.student}
                </td>

                <td className="p-3">
                  {loan.book}
                </td>

                <td className="p-3">
                  {loan.loanDate}
                </td>

                <td className="p-3">
                  {loan.dueDate}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
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

                <td className="p-3">
                  {loan.lateDays} días
                </td>

                <td className="p-3">
                  ${loan.fine}
                </td>

                <td className="p-3 text-center space-x-2">

                  {loan.status !== "Devuelto" && (
                    <button
                      onClick={() =>
                        handleReturn(loan.id)
                      }
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Devolver
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleView(loan.id)
                    }
                    className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700"
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