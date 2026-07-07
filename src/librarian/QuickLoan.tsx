import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { BarcodeScanner } from "../components/ui/BarcodeScanner";
import { Camera } from "lucide-react";

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

const normalizeLoan = (loan: any): Loan => ({
  id: loan.id,
  userId: loan.userId ?? loan.user?.id,
  bookId: loan.bookId ?? loan.book?.id,
  studentName: loan.studentName || loan.user?.name || "Sin estudiante",
  bookTitle: loan.bookTitle || loan.book?.title || "Sin libro",
  dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().slice(0, 10) : "",
  status: loan.status || "ACTIVE",
});

export default function QuickLoan() {
  const { isDark } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<"student" | "book" | null>(null);

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
        const [studentsRes, booksRes, loansRes] = await Promise.all([
          api.get("/users", { params: { role: "student" } }),
          api.get("/books"),
          api.get("/loans"),
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

        const rawLoans = loansRes.data?.success
          ? loansRes.data.data
          : loansRes.data || [];
        const normalizedLoans = (Array.isArray(rawLoans) ? rawLoans : []).map(normalizeLoan);
        setLoans(normalizedLoans);

        setStatusType("ok");
        setStatusMessage(`${filteredStudents.length} estudiantes, ${filteredBooks.length} libros disponibles y ${normalizedLoans.length} préstamos cargados`);
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
  const searchStudentLower = form.studentSearch.toLowerCase().trim();
  const exactStudentMatch = students.filter(s => s.studentId && s.studentId.toLowerCase() === searchStudentLower);
  
  const filteredStudents = exactStudentMatch.length > 0 
    ? exactStudentMatch
    : students.filter((s) =>
        s.name.toLowerCase().includes(searchStudentLower) ||
        s.studentId.toLowerCase().includes(searchStudentLower)
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
  const searchBookLower = form.bookSearch.toLowerCase().trim();
  const exactBookMatch = books.filter(b => b.isbn && b.isbn.toLowerCase() === searchBookLower);
  
  const filteredBooks = exactBookMatch.length > 0
    ? exactBookMatch
    : books.filter((b) =>
        b.title.toLowerCase().includes(searchBookLower) ||
        b.author.toLowerCase().includes(searchBookLower) ||
        (b.isbn && b.isbn.toLowerCase().includes(searchBookLower))
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

  const handleScan = (decodedText: string) => {
    if (scanTarget === "student") {
      const exactMatch = students.find(s => s.studentId && s.studentId.toLowerCase() === decodedText.toLowerCase());
      if (exactMatch) {
        handleSelectStudent(exactMatch);
      } else {
        alert("Alumno no encontrado con esa matrícula.");
      }
    } else if (scanTarget === "book") {
      const exactMatch = books.find(b => b.isbn && b.isbn.toLowerCase() === decodedText.toLowerCase());
      if (exactMatch) {
        handleSelectBook(exactMatch);
      } else {
        alert("Libro no encontrado o no disponible.");
      }
    }
    setShowScanner(false);
    setScanTarget(null);
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
      const normalizedLoan = normalizeLoan(newLoan);
      setLoans((prev) => [normalizedLoan, ...prev]);
      setBooks((prev) => prev.filter((b) => String(b.id) !== String(form.bookId)));

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
      <h1 className={`text-4xl font-bold mb-8 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>Registrar Préstamo</h1>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl mb-6 font-medium transition-colors ${
            statusType === "error"
              ? isDark 
                ? "bg-red-900 text-red-200 border border-red-700"
                : "bg-red-50 text-red-700 border border-red-200"
              : statusType === "ok"
              ? isDark
                ? "bg-green-900 text-green-200 border border-green-700"
                : "bg-green-50 text-green-700 border border-green-200"
              : isDark
              ? "bg-blue-900 text-blue-200 border border-blue-700"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
        {actionError && (
          <div className={`border text-sm rounded-lg p-3 mb-4 transition-colors ${isDark ? "bg-red-900 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}>
            {actionError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* SECCIÓN ALUMNO */}
          <div>
            <h2 className={`flex justify-between items-center text-lg font-semibold mb-4 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
              <span>👤 Alumno</span>
              <button
                type="button"
                onClick={() => { setScanTarget("student"); setShowScanner(true); }}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
                title="Escanear matrícula"
              >
                <Camera size={18} />
              </button>
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe nombre o matrícula..."
                value={form.studentSearch}
                onChange={(e) => handleStudentSearchChange(e.target.value)}
                onFocus={() => setShowStudentSuggestions(true)}
                className={`w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "border-[#E5E7EB] bg-white text-black"}`}
              />

              {showStudentSuggestions && form.studentSearch && filteredStudents.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto transition-colors ${isDark ? "bg-slate-700 border-slate-600" : "bg-white border-[#E5E7EB]"}`}>
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${isDark ? "hover:bg-slate-600 text-white border-slate-600" : "hover:bg-[#F8F9FB] text-black border-[#E5E7EB]"}`}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>{student.studentId} • {student.department}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.userId && (
              <div className={`mt-3 p-3 rounded-lg border transition-colors ${isDark ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"}`}>
                <p className={`text-sm font-medium ${isDark ? "text-green-200" : "text-green-700"}`}>✅ {form.studentSearch}</p>
                <p className={`text-xs ${isDark ? "text-green-300" : "text-green-600"}`}>Mat: {form.studentId} | {form.department}</p>
              </div>
            )}
          </div>

          {/* SECCIÓN LIBRO */}
          <div>
            <h2 className={`flex justify-between items-center text-lg font-semibold mb-4 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
              <span>📚 Libro</span>
              <button
                type="button"
                onClick={() => { setScanTarget("book"); setShowScanner(true); }}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
                title="Escanear libro"
              >
                <Camera size={18} />
              </button>
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe título o autor..."
                value={form.bookSearch}
                onChange={(e) => handleBookSearchChange(e.target.value)}
                onFocus={() => setShowBookSuggestions(true)}
                className={`w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "border-[#E5E7EB] bg-white text-black"}`}
              />

              {showBookSuggestions && form.bookSearch && filteredBooks.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto transition-colors ${isDark ? "bg-slate-700 border-slate-600" : "bg-white border-[#E5E7EB]"}`}>
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${isDark ? "hover:bg-slate-600 text-white border-slate-600" : "hover:bg-[#F8F9FB] text-black border-[#E5E7EB]"}`}
                    >
                      <div className="font-medium">{book.title}</div>
                      <div className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>{book.author}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.bookId && (
              <div className={`mt-3 p-3 rounded-lg border transition-colors ${isDark ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"}`}>
                <p className={`text-sm font-medium ${isDark ? "text-green-200" : "text-green-700"}`}>✅ {form.bookTitle}</p>
              </div>
            )}

            {form.bookId && (
              <div className={`mt-3 p-3 rounded-lg border transition-colors ${isDark ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"}`}>
                <p className={`text-sm font-medium ${isDark ? "text-green-200" : "text-green-700"}`}>✅ {form.bookTitle}</p>
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 border-t pt-6 transition-colors ${isDark ? "border-slate-700" : "border-[#E5E7EB]"}`}>
          <label className={`block mb-2 text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
            📅 Fecha de devolución
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className={`w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors ${isDark ? "bg-slate-700 border-slate-600 text-white" : "border-[#E5E7EB] bg-white text-black"}`}
          />
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!form.userId || !form.bookId || !form.dueDate}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1" : "bg-[#1E3A5F] hover:bg-[#3B82F6] hover:shadow-lg hover:-translate-y-1"}`}
          >
            ✔️ Registrar Préstamo
          </button>
        </div>
      </div>

      <div className={`mt-8 rounded-2xl shadow-sm border overflow-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
        <div className={`p-5 border-b transition-colors ${isDark ? "bg-slate-700 border-slate-600" : "bg-white border-[#E5E7EB]"}`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>📋 Préstamos Registrados</h2>
        </div>

        <table className="w-full">
          <thead className={`transition-colors ${isDark ? "bg-slate-700 text-white" : "bg-[#1E3A5F] text-white"}`}>
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Devolución</th>
              <th className="p-3 text-left">Estado</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className={`border-b transition-colors ${isDark ? "hover:bg-slate-700 border-slate-700" : "hover:bg-[#F8F9FB] border-[#E5E7EB]"}`}>
                <td className={`p-3 ${isDark ? "text-slate-200" : "text-black"}`}>{loan.studentName}</td>
                <td className={`p-3 ${isDark ? "text-slate-200" : "text-black"}`}>{loan.bookTitle}</td>
                <td className={`p-3 ${isDark ? "text-slate-200" : "text-black"}`}>{loan.dueDate}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-700"}`}>
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}

            {loans.length === 0 && (
              <tr>
                <td colSpan={4} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  No hay préstamos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => {
            setShowScanner(false);
            setScanTarget(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}