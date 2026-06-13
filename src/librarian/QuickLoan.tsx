import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

interface Loan {
  id: number;
  studentId: string;
  studentName: string;
  email: string;

  isbn: string;
  title: string;
  author: string;
  category: string;

  loanDate: string;
  dueDate: string;
  observations: string;

  finePerDay: number;
  status: string;
}

export default function QuickLoan() {
  const [loans, setLoans] = useState<Loan[]>([]);

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    email: "",

    isbn: "",
    title: "",
    author: "",
    category: "",

    loanDate: "",
    dueDate: "",
    observations: "",

    finePerDay: 5,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (
      !form.studentId ||
      !form.studentName ||
      !form.email ||
      !form.isbn ||
      !form.title ||
      !form.loanDate ||
      !form.dueDate
    ) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const newLoan: Loan = {
      id: Date.now(),

      studentId: form.studentId,
      studentName: form.studentName,
      email: form.email,

      isbn: form.isbn,
      title: form.title,
      author: form.author,
      category: form.category,

      loanDate: form.loanDate,
      dueDate: form.dueDate,
      observations: form.observations,

      finePerDay: form.finePerDay,
      status: "Activo",
    };

    setLoans([...loans, newLoan]);

    setForm({
      studentId: "",
      studentName: "",
      email: "",

      isbn: "",
      title: "",
      author: "",
      category: "",

      loanDate: "",
      dueDate: "",
      observations: "",

      finePerDay: 5,
    });

    alert("Préstamo registrado correctamente");
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Registrar Préstamo
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">

        <div className="grid md:grid-cols-2 gap-8">

          {/* Alumno */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Información del Alumno
            </h2>

            <input
              type="text"
              name="studentId"
              placeholder="Matrícula"
              value={form.studentId}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              name="studentName"
              placeholder="Nombre completo"
              value={form.studentName}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={form.email}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Libro */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Información del Libro
            </h2>

            <input
              type="text"
              name="isbn"
              placeholder="ISBN"
              value={form.isbn}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              name="title"
              placeholder="Título"
              value={form.title}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              name="author"
              placeholder="Autor"
              value={form.author}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              name="category"
              placeholder="Categoría"
              value={form.category}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Información préstamo */}
        <div className="mt-8 border-t pt-6">

          <h2 className="text-xl font-semibold mb-4">
            Información del Préstamo
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block mb-1 text-sm text-gray-600">
                Fecha de préstamo
              </label>

              <input
                type="date"
                name="loanDate"
                value={form.loanDate}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-600">
                Fecha de devolución
              </label>

              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

          </div>

          <div className="mt-4">
            <label className="block mb-1 text-sm text-gray-600">
              Multa por día de retraso
            </label>

            <input
              type="number"
              name="finePerDay"
              value={form.finePerDay}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <textarea
            name="observations"
            value={form.observations}
            onChange={handleChange}
            placeholder="Observaciones"
            rows={4}
            className="w-full border p-2 rounded mt-4"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
        >
          Registrar Préstamo
        </button>
      </div>

      {/* Tabla de préstamos */}
      <div className="bg-white mt-8 rounded-lg shadow overflow-hidden">

        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            Préstamos Registrados
          </h2>
        </div>

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
                Devolución
              </th>

              <th className="p-3 text-left">
                Multa/Día
              </th>

              <th className="p-3 text-left">
                Estado
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
                  {loan.studentName}
                </td>

                <td className="p-3">
                  {loan.title}
                </td>

                <td className="p-3">
                  {loan.loanDate}
                </td>

                <td className="p-3">
                  {loan.dueDate}
                </td>

                <td className="p-3">
                  ${loan.finePerDay}
                </td>

                <td className="p-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}

            {loans.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-gray-500"
                >
                  No hay préstamos registrados
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}