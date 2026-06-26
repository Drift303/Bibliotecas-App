import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

interface Student {
  id: string | number;
  name: string;
  email: string;
  studentId: string;
  department: string;
}

interface Book {
  id: string | number;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
}

interface Loan {
  id: string | number;
  userId: string | number;
  bookId: string | number;
  studentName?: string;
  bookTitle?: string;
  dueDate: string;
  status: string;
}

export default function QuickLoan() {
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    studentSearch: "",
    studentId: "",
    department: "",
    bookId: "",
    bookSearch: "",
    bookTitle: "",
    dueDate: "",
  });

  // --- CARGAR ESTUDIANTES Y LIBROS ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [studentsRes, booksRes] = await Promise.all([
          api.get("/users"),
          api.get("/books"),
        ]);

        const rawStudents = studentsRes.data?.success
          ? studentsRes.data.data
          : studentsRes.data || [];
        const filteredStudents = (Array.isArray(rawStudents) ? rawStudents : []).filter(
          (u: any) => u.role === "student"
        );
        setStudents(filteredStudents);

        const rawBooks = booksRes.data?.success
          ? booksRes.data.data
          : booksRes.data || [];
        const filteredBooks = (Array.isArray(rawBooks) ? rawBooks : []).filter(
          (b: any) => b.available === true
        );
        setBooks(filteredBooks);

        setStatusType("ok");
        setStatusMessage(`${filteredStudents.length} estudiantes, ${filteredBooks.length} libros disponibles`);
      } catch (err: any) {
        setStatusType("error");
        const detail = err?.response?.status
          ? `Error ${err.response.status} al cargar datos.`
          : "No se pudo conectar con el servidor.";
        setStatusMessage(detail);
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- BÚSQUEDA DE ESTUDIANTES EN TIEMPO REAL ---
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(form.studentSearch.toLowerCase()) ||
    s.studentId.toLowerCase().includes(form.studentSearch.toLowerCase())
  );

  const handleSelectStudent = (student: Student) => {
    setForm({
      ...form,
      userId: String(student.id),
      studentSearch: student.name,
      studentId: student.studentId,
      department: student.department,
    });
    setShowStudentSuggestions(false);
  };

  const handleStudentSearchChange = (value: string) => {
    setForm({
      ...form,
      studentSearch: value,
      userId: "",
    });
    setShowStudentSuggestions(true);
  };

  // --- BÚSQUEDA DE LIBROS EN TIEMPO REAL ---
  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(form.bookSearch.toLowerCase()) ||
    b.author.toLowerCase().includes(form.bookSearch.toLowerCase())
  );

  const handleSelectBook = (book: Book) => {
    setForm({
      ...form,
      bookId: String(book.id),
      bookSearch: book.title,
      bookTitle: book.title,
    });
    setShowBookSuggestions(false);
  };

  const handleBookSearchChange = (value: string) => {
    setForm({
      ...form,
      bookSearch: value,
      bookId: "",
    });
    setShowBookSuggestions(true);
  };

  const handleSubmit = async () => {
    if (!form.userId || !form.bookId || !form.dueDate) {
      alert("Selecciona alumno, libro y fecha de devolución");
      return;
    }

    setActionError("");

    try {
      const res = await api.post("/loans", {
        userId: form.userId,
        bookId: form.bookId,
        dueDate: form.dueDate,
      });

      const newLoan = res.data?.success ? res.data.data : res.data;
      setLoans([...loans, newLoan]);
      setBooks(books.filter((b) => b.id !== form.bookId));

      // Limpiar form
      setForm({
        userId: "",
        studentSearch: "",
        studentId: "",
        department: "",
        bookId: "",
        bookSearch: "",
        bookTitle: "",
        dueDate: "",
      });
      setStatusMessage("✅ Préstamo registrado correctamente");
      setStatusType("ok");
    } catch (err: any) {
      const detail = err?.response?.status
        ? `Error ${err.response.status}. ${err.response.data?.message || ""}`
        : err?.message || "Sin conexión con el servidor.";
      setActionError(detail);
      console.error("Error creando préstamo:", err);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 text-[#1E3A5F]">Registrar Préstamo</h1>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl mb-6 font-medium ${
            statusType === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : statusType === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {actionError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* SECCIÓN ALUMNO */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[#1E3A5F]">👤 Alumno</h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe nombre o matrícula..."
                value={form.studentSearch}
                onChange={(e) => handleStudentSearchChange(e.target.value)}
                onFocus={() => setShowStudentSuggestions(true)}
                className="w-full border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />

              {showStudentSuggestions && form.studentSearch && filteredStudents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F8F9FB] transition-colors border-b last:border-b-0"
                    >
                      <div className="font-medium text-[#1E3A5F]">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.studentId} • {student.department}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.userId && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">✅ {form.studentSearch}</p>
                <p className="text-xs text-green-600">Mat: {form.studentId} | {form.department}</p>
              </div>
            )}
          </div>

          {/* SECCIÓN LIBRO */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[#1E3A5F]">📚 Libro</h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe título o autor..."
                value={form.bookSearch}
                onChange={(e) => handleBookSearchChange(e.target.value)}
                onFocus={() => setShowBookSuggestions(true)}
                className="w-full border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />

              {showBookSuggestions && form.bookSearch && filteredBooks.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F8F9FB] transition-colors border-b last:border-b-0"
                    >
                      <div className="font-medium text-[#1E3A5F]">{book.title}</div>
                      <div className="text-sm text-gray-500">{book.author}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.bookId && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">✅ {form.bookTitle}</p>
              </div>
            )}

            {/* PRÓXIMAMENTE CÓDIGO DE BARRAS */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700 font-medium">🔜 Próximamente: Código de Barras</p>
            </div>
            <button className="w-full mt-2 border border-yellow-300 text-yellow-700 px-4 py-2 rounded-lg transition-colors hover:bg-yellow-50">
              escaneo 
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-[#E5E7EB] pt-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            📅 Fecha de devolución
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!form.userId || !form.bookId || !form.dueDate}
            className="bg-[#1E3A5F] text-white px-6 py-3 rounded-xl transition-all duration-300 hover:bg-[#3B82F6] hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✔️ Registrar Préstamo
          </button>
        </div>
      </div>

      <div className="bg-white mt-8 rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <h2 className="text-xl font-bold text-[#1E3A5F]">📋 Préstamos Registrados</h2>
        </div>

        <table className="w-full">
          <thead className="bg-[#1E3A5F] text-white">
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Devolución</th>
              <th className="p-3 text-left">Estado</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b hover:bg-[#F8F9FB] transition-colors">
                <td className="p-3">{loan.studentName}</td>
                <td className="p-3">{loan.bookTitle}</td>
                <td className="p-3">{loan.dueDate}</td>
                <td className="p-3">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}

            {loans.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">
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