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

  const [showScannerOptions, setShowScannerOptions] =
    useState(false);

  const handleScanBarcode = () => {
    alert("Leyendo código de barras...");
  };

  const handleScanQR = () => {
    alert("Leyendo código QR...");
  };

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
      <h1 className="text-4xl font-bold mb-8 text-[#1E3A5F]">
        Registrar Préstamo
      </h1>

      <div
        className="
          bg-white
          p-6
          rounded-2xl
          shadow-sm
          border
          border-[#E5E7EB]
        "
      >
        <div className="grid md:grid-cols-2 gap-8">

          {/* Alumno */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
              Información del Alumno
            </h2>

            <input
              type="text"
              name="studentId"
              placeholder="Matrícula"
              value={form.studentId}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                mb-3
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />

            <input
              type="text"
              name="studentName"
              placeholder="Nombre completo"
              value={form.studentName}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                mb-3
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />

            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={form.email}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />
          </div>

          {/* Libro */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
              Información del Libro
            </h2>

            <input
              type="text"
              name="isbn"
              placeholder="ISBN"
              value={form.isbn}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                mb-3
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />

            <input
              type="text"
              name="title"
              placeholder="Título"
              value={form.title}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                mb-3
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />

            <input
              type="text"
              name="author"
              placeholder="Autor"
              value={form.author}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                mb-3
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />

            <input
              type="text"
              name="category"
              placeholder="Categoría"
              value={form.category}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />
          </div>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB] pt-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
            Información del Préstamo
          </h2>
                    <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Fecha de préstamo
              </label>

              <input
                type="date"
                name="loanDate"
                value={form.loanDate}
                onChange={handleChange}
                className="
                  w-full
                  border
                  border-[#E5E7EB]
                  p-3
                  rounded-xl
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#3B82F6]
                "
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Fecha de devolución
              </label>

              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="
                  w-full
                  border
                  border-[#E5E7EB]
                  p-3
                  rounded-xl
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#3B82F6]
                "
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Multa por día de retraso
            </label>

            <input
              type="number"
              name="finePerDay"
              value={form.finePerDay}
              onChange={handleChange}
              className="
                w-full
                border
                border-[#E5E7EB]
                p-3
                rounded-xl
                focus:outline-none
                focus:ring-2
                focus:ring-[#3B82F6]
              "
            />
          </div>

          <textarea
            name="observations"
            value={form.observations}
            onChange={handleChange}
            placeholder="Observaciones"
            rows={4}
            className="
              w-full
              border
              border-[#E5E7EB]
              p-3
              rounded-xl
              mt-4
              focus:outline-none
              focus:ring-2
              focus:ring-[#3B82F6]
            "
          />
        </div>

        <div className="flex flex-wrap gap-4 mt-6">

          <button
            onClick={handleSubmit}
            className="
              bg-[#1E3A5F]
              text-white
              px-6
              py-3
              rounded-xl
              transition-all
              duration-300
              hover:bg-[#3B82F6]
              hover:shadow-lg
              hover:-translate-y-1
            "
          >
            Registrar Préstamo
          </button>

          <div className="relative">

            <button
              onClick={() =>
                setShowScannerOptions(
                  !showScannerOptions
                )
              }
              className="
                bg-[#3B82F6]
                text-white
                px-6
                py-3
                rounded-xl
                transition-all
                duration-300
                hover:shadow-lg
                hover:-translate-y-1
              "
            >
              Escanear Libro
            </button>

            {showScannerOptions && (
              <div
                className="
                  absolute
                  left-0
                  mt-2
                  w-60
                  bg-white
                  rounded-xl
                  shadow-xl
                  border
                  border-[#E5E7EB]
                  overflow-hidden
                  z-10
                "
              >
                <button
                  onClick={handleScanBarcode}
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    hover:bg-[#F8F9FB]
                    transition-colors
                  "
                >
                  📊 Escanear código de barras
                </button>

                <button
                  onClick={handleScanQR}
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    hover:bg-[#F8F9FB]
                    transition-colors
                    border-t
                    border-[#E5E7EB]
                  "
                >
                  🔳 Escanear código QR
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      <div
        className="
          bg-white
          mt-8
          rounded-2xl
          shadow-sm
          border
          border-[#E5E7EB]
          overflow-hidden
        "
      >
        <div className="p-5 border-b border-[#E5E7EB]">
          <h2 className="text-xl font-bold text-[#1E3A5F]">
            Préstamos Registrados
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-[#1E3A5F] text-white">
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Préstamo</th>
              <th className="p-3 text-left">Devolución</th>
              <th className="p-3 text-left">Multa/Día</th>
              <th className="p-3 text-left">Estado</th>
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
                  <span
                    className="
                      bg-green-100
                      text-green-700
                      px-3
                      py-1
                      rounded-full
                      text-sm
                      font-medium
                    "
                  >
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}

            {loans.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-500 font-medium"
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