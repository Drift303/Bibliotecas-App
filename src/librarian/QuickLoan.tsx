import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import Pagination from "../components/Pagination";
import { BarcodeScanner } from "../components/ui/BarcodeScanner";
import { useTheme } from "../context/ThemeContext";
import { createClientId, readCache, saveCache } from "../offline/db";
import { getPendingLoansCount, queueLoanTransaction, syncPendingLoans } from "../offline/syncLoans";

interface Student {
  id: string | number;
  name: string;
  email: string;
  studentId: string | null;
  department: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
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
  syncStatus?: "online" | "pending";
}

const normalizeLoan = (loan: any): Loan => ({
  id: loan.id,
  userId: loan.userId ?? loan.user?.id,
  bookId: loan.bookId ?? loan.book?.id,
  studentName: loan.studentName || loan.user?.name || "Sin estudiante",
  bookTitle: loan.bookTitle || loan.book?.title || "Sin libro",
  dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().slice(0, 10) : "",
  status: loan.status || "ACTIVE",
  syncStatus: loan.syncStatus || "online",
});

export default function QuickLoan() {
  const { isDark } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<"student" | "book" | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  // Paginación aparte para la tabla "Prestamos Registrados" al fondo de esta
  // pantalla. Es la única paginación visible en esta vista.
  const [loansPage, setLoansPage] = useState(1);
  const [loansTotalPages, setLoansTotalPages] = useState(1);
  const isFirstLoansPageRender = useRef(true);

  const tenantType = localStorage.getItem("tenantType") || "SCHOOL";

  const [form, setForm] = useState({
    userId: "",
    studentSearch: "",
    studentId: "",
    department: "",
    bookId: "",
    bookSearch: "",
    bookTitle: "",
    dueDate: "",
    departmentId: "",
    loanType: "HOME" as "HOME" | "IN_LIBRARY",
  });

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, booksRes, loansRes, departmentsRes] = await Promise.all([
        api.get("/users", { params: { role: "student" } }),
        api.get("/books", { params: { page: 1, availability: "available" } }),
        api.get("/loans", { params: { page: loansPage } }),
        tenantType === "SCHOOL" ? api.get("/departments") : Promise.resolve({ data: { data: [] } }),
      ]);

      const rawDepartments = departmentsRes.data?.success
        ? departmentsRes.data.data
        : departmentsRes.data || [];
      const loadedDepartments = Array.isArray(rawDepartments) ? rawDepartments : [];
      setDepartments(loadedDepartments);

      const rawStudents = studentsRes.data?.success ? studentsRes.data.data : studentsRes.data || [];
      const filteredStudents = (Array.isArray(rawStudents) ? rawStudents : []).filter(
        (u: any) => u.role === "student"
      );
      setStudents(filteredStudents);

      const rawBooks = booksRes.data?.success ? booksRes.data.data : booksRes.data || [];
      const filteredBooks = (Array.isArray(rawBooks) ? rawBooks : []).filter(
        (b: any) => b.available === true
      );
      setBooks(filteredBooks);

      const rawLoans = loansRes.data?.success ? loansRes.data.data : loansRes.data || [];
      const normalizedLoans = (Array.isArray(rawLoans) ? rawLoans : []).map(normalizeLoan);
      setLoans(normalizedLoans);
      setLoansTotalPages(Number(loansRes.data?.totalPages || 1));

      await Promise.all([
        saveCache("quickLoan:students", filteredStudents),
        saveCache("quickLoan:books", filteredBooks),
        saveCache("quickLoan:loans", normalizedLoans),
        saveCache("quickLoan:departments", loadedDepartments),
      ]);

      setStatusType("ok");
      setStatusMessage(
        `${filteredStudents.length} estudiantes, ${filteredBooks.length} libros disponibles y ${normalizedLoans.length} préstamos cargados`
      );
    } catch (err: any) {
      const [cachedStudents, cachedBooks, cachedLoans, cachedDepartments] = await Promise.all([
        readCache<Student[]>("quickLoan:students"),
        readCache<Book[]>("quickLoan:books"),
        readCache<Loan[]>("quickLoan:loans"),
        readCache<{ id: string; name: string }[]>("quickLoan:departments"),
      ]);

      if (cachedStudents || cachedBooks || cachedLoans) {
        setStudents(cachedStudents || []);
        setBooks(cachedBooks || []);
        setLoans(cachedLoans || []);
        setDepartments(cachedDepartments || []);
        setStatusType("info");
        setStatusMessage("Modo offline: usando datos guardados en este dispositivo.");
      } else {
        setStatusType("error");
        const detail = err?.response?.status
          ? `Error ${err.response.status} al cargar datos.`
          : "No se pudo conectar con el servidor y no hay datos offline guardados.";
        setStatusMessage(detail);
      }
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
      refreshPendingCount();
    }
  };

  // Búsqueda de libros: siempre trae la primera página de resultados
  // filtrados por texto. No hay UI de paginación para este buscador.
  useEffect(() => {
    if (!isOnline) return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get("/books", {
          params: { page: 1, availability: "available", search: form.bookSearch.trim() || undefined },
        });
        const rawBooks = res.data?.success ? res.data.data : [];
        const availableBooks = (Array.isArray(rawBooks) ? rawBooks : []).filter((book: any) => book.available === true);
        setBooks(availableBooks);
        await saveCache("quickLoan:books", availableBooks);
      } catch {
        // El flujo offline existente conserva la última página almacenada.
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [form.bookSearch, isOnline]);

  // Recarga solo la tabla "Prestamos Registrados" al cambiar de página, sin
  // volver a pedir alumnos/libros/departamentos (eso ya lo trae loadData).
  useEffect(() => {
    if (isFirstLoansPageRender.current) {
      isFirstLoansPageRender.current = false;
      return;
    }
    if (!isOnline) return;
    api
      .get("/loans", { params: { page: loansPage } })
      .then((res) => {
        const rawLoans = res.data?.success ? res.data.data : [];
        const normalizedLoans = (Array.isArray(rawLoans) ? rawLoans : []).map(normalizeLoan);
        setLoans(normalizedLoans);
        setLoansTotalPages(Number(res.data?.totalPages || 1));
        saveCache("quickLoan:loans", normalizedLoans);
      })
      .catch(() => {
        // El flujo offline existente conserva la última página almacenada.
      });
  }, [loansPage, isOnline]);

  const searchStudentLower = form.studentSearch.toLowerCase().trim();
  const exactStudentMatch = students.filter(
    (s) => s.studentId && s.studentId.toLowerCase() === searchStudentLower
  );

  const filteredStudents =
    exactStudentMatch.length > 0
      ? exactStudentMatch
      : students.filter(
          (s) =>
            s.name.toLowerCase().includes(searchStudentLower) ||
            Boolean(s.studentId && s.studentId.toLowerCase().includes(searchStudentLower))
        );

  const filteredBooks = books;

  const handleSelectStudent = (student: Student) => {
    setForm({
      ...form,
      userId: String(student.id),
      studentSearch: student.name,
      studentId: student.studentId || "",
      department: student.department || "",
    });
    setShowStudentSuggestions(false);
  };

  const handleStudentSearchChange = (value: string) => {
    setForm({ ...form, studentSearch: value, userId: "" });
    setShowStudentSuggestions(true);
  };

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
    setForm({ ...form, bookSearch: value, bookId: "" });
    setShowBookSuggestions(true);
  };

  const handleScan = (decodedText: string) => {
    if (scanTarget === "student") {
      const exactMatch = students.find(
        (s) => s.studentId && s.studentId.toLowerCase() === decodedText.toLowerCase()
      );
      if (exactMatch) {
        handleSelectStudent(exactMatch);
      } else {
        alert("Alumno no encontrado con esa matricula.");
      }
    } else if (scanTarget === "book") {
      const exactMatch = books.find(
        (b) => b.isbn && b.isbn.toLowerCase() === decodedText.toLowerCase()
      );
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
      alert("Selecciona alumno, libro y fecha de devolucion");
      return;
    }

    setActionError("");

    try {
      const res = await api.post("/loans", {
        userId: form.userId,
        bookId: form.bookId,
        dueDate: form.dueDate,
        loanType: form.loanType,
        departmentId: form.departmentId || undefined,
      });

      const newLoan = res.data?.success ? res.data.data : res.data;
      const normalizedLoan = normalizeLoan(newLoan);
      const nextLoans = [normalizedLoan, ...loans];
      const nextBooks = books.filter((b) => String(b.id) !== String(form.bookId));
      setLoans(nextLoans);
      setBooks(nextBooks);
      await Promise.all([
        saveCache("quickLoan:loans", nextLoans),
        saveCache("quickLoan:books", nextBooks),
      ]);
      resetForm();
      setStatusMessage("✅ Préstamo registrado correctamente");
      setStatusType("ok");
    } catch (err: any) {
      const shouldQueueOffline = !err?.response || !navigator.onLine;

      if (!shouldQueueOffline) {
        const detail = err?.response?.status
          ? `Error ${err.response.status}. ${err.response.data?.message || ""}`
          : err?.message || "Sin conexion con el servidor.";
        setActionError(detail);
        console.error("Error creando prestamo:", err);
        return;
      }

      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) {
        setActionError("No se pudo guardar offline porque falta el tenant de la sesion.");
        return;
      }

      const clientId = createClientId("loan");
      const offlineLoan = normalizeLoan({
        id: clientId,
        userId: form.userId,
        bookId: form.bookId,
        user: { name: form.studentSearch },
        book: { title: form.bookTitle },
        dueDate: form.dueDate,
        status: "ACTIVE",
        syncStatus: "pending",
      });

      await queueLoanTransaction({
        clientId,
        tenantId,
        userId: form.userId,
        bookId: form.bookId,
        loanDate: new Date().toISOString(),
        dueDate: form.dueDate,
        status: "BORROWED",
        studentName: form.studentSearch,
        bookTitle: form.bookTitle,
      });

      const nextLoans = [offlineLoan, ...loans];
      const nextBooks = books.filter((b) => String(b.id) !== String(form.bookId));
      setLoans(nextLoans);
      setBooks(nextBooks);
      await Promise.all([
        saveCache("quickLoan:loans", nextLoans),
        saveCache("quickLoan:books", nextBooks),
      ]);

      resetForm();
      setStatusType("info");
      setStatusMessage("Prestamo guardado offline. Se sincronizara cuando vuelva internet.");
      refreshPendingCount();
      console.error("Prestamo guardado offline por error de red:", err);
    }
  };

  const handleManualSync = async () => {
    const result = await syncPendingLoans();
    await refreshPendingCount();

    if (result.error) {
      setStatusType("error");
      setStatusMessage(`No se pudo sincronizar: ${result.error}`);
    } else if (result.processed > 0) {
      setStatusType("ok");
      setStatusMessage(`Se sincronizaron ${result.processed} movimientos pendientes.`);
      loadData();
    } else {
      setStatusType("info");
      setStatusMessage("No hay movimientos pendientes por sincronizar.");
    }
  };

  const resetForm = () => {
    setForm({
      userId: "",
      studentSearch: "",
      studentId: "",
      department: "",
      bookId: "",
      bookSearch: "",
      bookTitle: "",
      dueDate: "",
      departmentId: "",
      loanType: "HOME",
    });
  };

  async function refreshPendingCount() {
    setPendingSyncCount(await getPendingLoansCount());
  }

  return (
    <DashboardLayout>
      <h1 className={`text-4xl font-bold mb-8 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
        Registrar Prestamo
      </h1>

      {statusMessage && (
        <div className={`p-4 rounded-xl mb-6 font-medium transition-colors ${messageClass(statusType, isDark)}`}>
          {statusMessage}
        </div>
      )}

      <div className={`p-4 rounded-xl mb-6 font-medium border ${connectionClass(isOnline, isDark)}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {isOnline ? "Con conexion" : "Sin conexion: los prestamos se guardaran offline"}
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

      <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
        {actionError && (
          <div className={`border text-sm rounded-lg p-3 mb-4 transition-colors ${isDark ? "bg-red-900 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}>
            {actionError}
          </div>
        )}

        {loading && (
          <div className={`mb-4 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Cargando datos...
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className={`flex justify-between items-center text-lg font-semibold mb-4 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
              <span>Alumno</span>
              <button
                type="button"
                onClick={() => { setScanTarget("student"); setShowScanner(true); }}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isDark ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}
                title="Escanear matricula"
              >
                <Camera size={18} />
              </button>
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe nombre o matricula..."
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
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${isDark ? "hover:bg-slate-600 text-white border-slate-600" : "hover:bg-[#F8F9FB] text-black border-[#E5E7EB]"}`}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                        {student.studentId
                          ? `${student.studentId} • ${student.department || ""}`
                          : student.contactEmail || student.contactPhone || "Biblioteca pública"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.userId && (
              <div className={`mt-3 p-3 rounded-lg border transition-colors ${isDark ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"}`}>
                <p className={`text-sm font-medium ${isDark ? "text-green-200" : "text-green-700"}`}>✅ {form.studentSearch}</p>
                <p className={`text-xs ${isDark ? "text-green-300" : "text-green-600"}`}>
                  {form.studentId ? `Mat: ${form.studentId} | ${form.department}` : "Lector de biblioteca pública"}
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 className={`flex justify-between items-center text-lg font-semibold mb-4 ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
              <span>Libro</span>
              <button
                type="button"
                onClick={() => { setScanTarget("book"); setShowScanner(true); }}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${isDark ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}
                title="Escanear libro"
              >
                <Camera size={18} />
              </button>
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe titulo o autor..."
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
                      type="button"
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
                <p className={`text-sm font-medium ${isDark ? "text-green-200" : "text-green-700"}`}>{form.bookTitle}</p>
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 border-t pt-6 transition-colors ${isDark ? "border-slate-700" : "border-[#E5E7EB]"}`}>
          <label className={`block mb-2 text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
            Fecha de devolucion
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className={`w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors ${isDark ? "bg-slate-700 border-slate-600 text-white" : "border-[#E5E7EB] bg-white text-black"}`}
          />
        </div>

        {tenantType === "SCHOOL" && (
          <div className="mt-4">
            <label className={`block mb-2 text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              🏫 Departamento / Carrera
            </label>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className={`w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors ${isDark ? "bg-slate-700 border-slate-600 text-white" : "border-[#E5E7EB] bg-white text-black"}`}
            >
              <option value="">Selecciona uno (opcional)</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className={`block mb-2 text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
            📖 Tipo de préstamo
          </label>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 ${isDark ? "text-slate-200" : "text-black"}`}>
              <input
                type="radio"
                name="loanType"
                checked={form.loanType === "HOME"}
                onChange={() => setForm({ ...form, loanType: "HOME" })}
              />
              A domicilio
            </label>
            <label className={`flex items-center gap-2 ${isDark ? "text-slate-200" : "text-black"}`}>
              <input
                type="radio"
                name="loanType"
                checked={form.loanType === "IN_LIBRARY"}
                onChange={() => setForm({ ...form, loanType: "IN_LIBRARY" })}
              />
              En sala
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.userId || !form.bookId || !form.dueDate}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1" : "bg-[#1E3A5F] hover:bg-[#3B82F6] hover:shadow-lg hover:-translate-y-1"}`}
          >
            Registrar Prestamo
          </button>
        </div>
      </div>

      <div className={`mt-8 rounded-2xl shadow-sm border overflow-hidden transition-colors ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
        <div className={`p-5 border-b transition-colors ${isDark ? "bg-slate-700 border-slate-600" : "bg-white border-[#E5E7EB]"}`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>Prestamos Registrados</h2>
        </div>

        <table className="w-full">
          <thead className={`transition-colors ${isDark ? "bg-slate-700 text-white" : "bg-[#1E3A5F] text-white"}`}>
            <tr>
              <th className="p-3 text-left">Alumno</th>
              <th className="p-3 text-left">Libro</th>
              <th className="p-3 text-left">Devolucion</th>
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${loan.syncStatus === "pending" ? "bg-amber-100 text-amber-700" : isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-700"}`}>
                    {loan.syncStatus === "pending" ? "Pendiente sync" : loan.status}
                  </span>
                </td>
              </tr>
            ))}

            {loans.length === 0 && (
              <tr>
                <td colSpan={4} className={`p-8 text-center font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  No hay prestamos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="px-6 pb-5">
            <Pagination page={loansPage} totalPages={loansTotalPages} onPageChange={setLoansPage} isDark={isDark} />
          </div>
        )}
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

function messageClass(type: "ok" | "error" | "info", isDark: boolean) {
  if (type === "error") {
    return isDark
      ? "bg-red-900 text-red-200 border border-red-700"
      : "bg-red-50 text-red-700 border border-red-200";
  }
  if (type === "ok") {
    return isDark
      ? "bg-green-900 text-green-200 border border-green-700"
      : "bg-green-50 text-green-700 border border-green-200";
  }
  return isDark
    ? "bg-blue-900 text-blue-200 border border-blue-700"
    : "bg-blue-50 text-blue-700 border border-blue-200";
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