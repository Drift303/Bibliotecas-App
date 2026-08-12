import { useEffect, useState } from "react";
import api from "../api";
import BookCard from "../cards/BookCard";
import LogoutButton from "../components/LogoutButton";
import Pagination from "../components/Pagination";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import { readCache, saveCache } from "../offline/db";
import { 
  BookX,
  X,
  MapPin,
  BookMarked,
  Package,
  } from "lucide-react";

type AvailabilityFilter = "todos" | "disponibles" | "prestados";
type PhysicalStatus = "GOOD" | "DAMAGED" | "LOST";
type LoanStatus = "Activo" | "Vencido" | "Devuelto";

interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  locationHall: string;
  locationShelf: string;
  storageLocation: string | null;
  available: boolean;
  status: "Disponible" | "Prestado";
  statusPhysical: PhysicalStatus;
}

interface Loan {
  id: string;
  book: string;
  loanDate: string;
  dueDate: string;
  returnDate: string;
  status: LoanStatus;
  fine: number;
}

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function Catalog() {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<AvailabilityFilter>("todos");
  const [books, setBooks] = useState<Book[]>([]);
  const [currentLoans, setCurrentLoans] = useState<Loan[]>([]);
  const [previousLoans, setPreviousLoans] = useState<Loan[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const [loanStatusMessage, setLoanStatusMessage] = useState("");
  const [bookPage, setBookPage] = useState(1);
  const [bookTotalPages, setBookTotalPages] = useState(1);
  // Página separada para cada sub-sección del historial: los préstamos
  // actuales (activos/vencidos) y los anteriores (devueltos) se piden y
  // paginan de forma independiente, no como una sola tabla combinada.
  const [currentLoanPage, setCurrentLoanPage] = useState(1);
  const [currentLoanTotalPages, setCurrentLoanTotalPages] = useState(1);
  const [previousLoanPage, setPreviousLoanPage] = useState(1);
  const [previousLoanTotalPages, setPreviousLoanTotalPages] = useState(1);
  const [totalFines, setTotalFines] = useState(0);

  useEffect(() => {
    const loadBooks = async () => {
      setLoadingBooks(true);
      try {
        const availability = filter === "disponibles" ? "available" : filter === "prestados" ? "borrowed" : undefined;
        const res = await api.get("/books", { params: { page: bookPage, search: searchText.trim() || undefined, availability } });
        const rawBooks = res.data?.success ? res.data.data : res.data || [];
        const normalizedBooks = (Array.isArray(rawBooks) ? rawBooks : []).map(mapBook);

        setBooks(normalizedBooks);
        setBookTotalPages(Number(res.data?.totalPages || 1));
        await saveCache("studentCatalog:books", normalizedBooks);
        setStatusType("ok");
        setStatusMessage(
          normalizedBooks.length > 0
            ? "Datos sincronizados desde el servidor."
            : "Conectado al servidor. No hay libros disponibles todavia."
        );
      } catch (err: any) {
        const cachedBooks = await readCache<Book[]>("studentCatalog:books");
        if (cachedBooks) {
          setBooks(cachedBooks);
          setStatusType("info");
          setStatusMessage("Modo offline: mostrando el ultimo catalogo guardado.");
        } else {
          setBooks([]);
          setStatusType("error");
          const detail = err?.response?.status
            ? `Error ${err.response.status} al contactar el servidor.`
            : "No se pudo conectar con el servidor. Revisa tu conexion.";
          setStatusMessage(detail);
        }
        console.error("Error cargando libros:", err);
      } finally {
        setLoadingBooks(false);
      }
    };

    const timer = window.setTimeout(loadBooks, 250);
    return () => window.clearTimeout(timer);
  }, [bookPage, filter, searchText]);

  // Préstamos actuales: status=ACTIVE ya viene ordenado por el backend con
  // los vencidos primero (fecha de vencimiento ascendente), tal como se pidió.
  useEffect(() => {
    const loadCurrentLoans = async () => {
      setLoadingLoans(true);
      try {
        const res = await api.get("/loans", { params: { page: currentLoanPage, status: "ACTIVE" } });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalizedLoans = data.map(mapLoan);
        setCurrentLoans(normalizedLoans);
        setCurrentLoanTotalPages(Number(res.data?.totalPages || 1));
        setTotalFines(Number(res.data?.stats?.pendingFines || 0));
        await saveCache("studentCatalog:currentLoans", normalizedLoans);
        setLoanStatusMessage("");
      } catch (err) {
        const cachedLoans = await readCache<Loan[]>("studentCatalog:currentLoans");
        if (cachedLoans) {
          setCurrentLoans(cachedLoans);
          setLoanStatusMessage("Modo offline: mostrando el ultimo historial guardado.");
        } else {
          setCurrentLoans([]);
          setStatusMessage("No se pudieron cargar los prestamos");
          setStatusType("error");
          setLoanStatusMessage("No se pudieron cargar los prestamos");
        }
      } finally {
        setLoadingLoans(false);
      }
    };

    loadCurrentLoans();
  }, [currentLoanPage]);

  // Préstamos anteriores: solo los ya devueltos, ordenados del más reciente
  // al más antiguo (lo maneja el backend con status=RETURNED).
  useEffect(() => {
    const loadPreviousLoans = async () => {
      try {
        const res = await api.get("/loans", { params: { page: previousLoanPage, status: "RETURNED" } });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalizedLoans = data.map(mapLoan);
        setPreviousLoans(normalizedLoans);
        setPreviousLoanTotalPages(Number(res.data?.totalPages || 1));
        await saveCache("studentCatalog:previousLoans", normalizedLoans);
      } catch (err) {
        const cachedLoans = await readCache<Loan[]>("studentCatalog:previousLoans");
        if (cachedLoans) setPreviousLoans(cachedLoans);
      }
    };

    loadPreviousLoans();
  }, [previousLoanPage]);

  return (
    <div className="relative min-h-screen p-6 md:p-8 transition-colors bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden">
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              CATÁLOGO DE LIBROS
            </h1>
            {statusMessage && (
              <p className={`text-sm font-medium ${statusTextClass(statusType)}`}>
                {statusMessage}
              </p>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
              Explora la biblioteca, encuentra libros por titulo, autor o ISBN, y visualiza su estado al instante.
            </p>
            <a
              href="#historial"
              className={`mt-3 inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                totalFines > 0
                  ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              }`}
            >
              Ver mi historial de préstamos
              {totalFines > 0 && <span>· Multas: {money.format(totalFines)}</span>}
              <span aria-hidden>↓</span>
            </a>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-3">
            <div className="flex justify-end items-center gap-3">
              <ThemeToggleButton />
              <LogoutButton />
            </div>

            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="search">
              Buscar libro
            </label>
            <div className="relative">
              <input
                id="search"
                value={searchText}
                onChange={(event) => { setSearchText(event.target.value); setBookPage(1); }}
                type="text"
                placeholder="Ej. Clean Code o Robert C. Martin"
                className="w-full rounded-2xl border border-white/50 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm shadow-slate-200/50 dark:shadow-black/50 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500">
                Buscar
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/40 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 w-fit">
          {[
            { value: "todos", label: "Todos" },
            { value: "disponibles", label: "Disponibles" },
            { value: "prestados", label: "Prestados" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => { setFilter(item.value as AvailabilityFilter); setBookPage(1); }}
              className={`
                rounded-full
                px-5
                py-2.5
                text-sm
                font-semibold
                transition-all
                duration-300
                ease-in-out
                transform
                hover:scale-105
                ${
                  filter === item.value
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-700/30"
                  : "bg-transparent border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500"
                }
            `}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loadingBooks ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            Cargando catalogo...
          </div>
        ) : books.length === 0 && statusType === "error" ? (
          <EmptyState
            tone="error"
            title="No se pudieron cargar los libros"
            subtitle={statusMessage}
          />
        ) : books.length === 0 ? (
          <EmptyState
            title="No hay libros disponibles todavia"
            subtitle="Cuando la biblioteca agregue libros, apareceran aqui."
          />
        ) : books.length === 0 ? (
          <EmptyState
            title="No se encontraron libros"
            subtitle="Prueba con otro titulo, autor, ISBN o cambia el filtro activo."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}
        {!loadingBooks && <Pagination page={bookPage} totalPages={bookTotalPages} onPageChange={setBookPage} />}

        <section id="historial" className="mt-12 scroll-mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                HISTORIAL DE PRÉSTAMOS
              </h2>
              {loanStatusMessage && (
                <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                  {loanStatusMessage}
                </p>
              )}
            </div>
            <div className={`rounded-2xl px-5 py-3 text-sm font-bold shadow-sm ${totalFines > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
              Multas: {money.format(totalFines)}
            </div>
          </div>

          {/* Préstamos actuales: activos y vencidos, siempre primero */}
          <div className="mb-8">
            <h3 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
              Préstamos actuales
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/40 dark:shadow-black/30 transition-all">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">Libro</th>
                      <th className="p-3 text-left font-semibold">Fecha prestamo</th>
                      <th className="p-3 text-left font-semibold">Fecha vencimiento</th>
                      <th className="p-3 text-left font-semibold">Estado</th>
                      <th className="p-3 text-left font-semibold">Multa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLoans.map((loan, index) => (
                      <tr
                        key={loan.id}
                        className={`border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${
                          index % 2 === 0
                            ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{loan.book}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{loan.loanDate}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{loan.dueDate}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${loanStatusClass(loan.status)}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={loan.fine > 0 ? "font-bold text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}>
                            {money.format(loan.fine)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!loadingLoans && currentLoans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8">
                          <EmptyState
                            title="No tienes préstamos activos"
                            subtitle="Cuando solicites un libro aparecerá aquí."
                          />
                        </td>
                      </tr>
                    )}

                    {loadingLoans && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center font-medium text-slate-500 dark:text-slate-400">
                          Cargando prestamos...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {!loadingLoans && (
              <Pagination page={currentLoanPage} totalPages={currentLoanTotalPages} onPageChange={setCurrentLoanPage} />
            )}
          </div>

          {/* Préstamos anteriores: ya devueltos, como historial */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">
              Préstamos anteriores
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/40 dark:shadow-black/30 transition-all">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">Libro</th>
                      <th className="p-3 text-left font-semibold">Fecha prestamo</th>
                      <th className="p-3 text-left font-semibold">Fecha devolucion</th>
                      <th className="p-3 text-left font-semibold">Estado</th>
                      <th className="p-3 text-left font-semibold">Multa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previousLoans.map((loan, index) => (
                      <tr
                        key={loan.id}
                        className={`border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${
                          index % 2 === 0
                            ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{loan.book}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{loan.loanDate}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{loan.returnDate}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${loanStatusClass(loan.status)}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={loan.fine > 0 ? "font-bold text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}>
                            {money.format(loan.fine)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {previousLoans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8">
                          <EmptyState
                            title="Aún no tienes préstamos devueltos"
                            subtitle="Tu historial de préstamos anteriores aparecerá aquí."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={previousLoanPage} totalPages={previousLoanTotalPages} onPageChange={setPreviousLoanPage} />
          </div>
        </section>
      </div>

      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}

function mapBook(book: any): Book {
  const available =
    book.available === true || book.status === "AVAILABLE" || book.statusLogical === "ACTIVE";

  return {
    id: book.id,
    isbn: book.isbn || "S/N",
    title: book.title || "Sin titulo",
    author: book.author || "Autor sin especificar",
    publisher: book.publisher || null,
    locationHall: book.locationHall || "Sin especificar",
    locationShelf: book.locationShelf || "Sin especificar",
    storageLocation: book.storageLocation || null,
    available,
    status: available ? "Disponible" : "Prestado",
    statusPhysical: normalizePhysicalStatus(book.statusPhysical),
  };
}

function mapLoan(loan: any): Loan {
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  const isOverdue = loan.status === "ACTIVE" && dueDate !== null && dueDate < new Date();

  return {
    id: String(loan.id),
    book: loan.book?.title || "Libro sin titulo",
    loanDate: formatDate(loan.createdAt),
    dueDate: formatDate(loan.dueDate),
    returnDate: formatDate(loan.returnDate),
    status: loan.status === "RETURNED" ? "Devuelto" : isOverdue ? "Vencido" : "Activo",
    fine: Number(loan.fineAmount || 0),
  };
}

function normalizePhysicalStatus(value: unknown): PhysicalStatus {
  return value === "DAMAGED" || value === "LOST" || value === "GOOD" ? value : "GOOD";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX");
}

function statusTextClass(type: "ok" | "error" | "info") {
  if (type === "error") return "text-red-600 dark:text-red-400";
  if (type === "ok") return "text-emerald-600 dark:text-emerald-400";
  return "text-blue-600 dark:text-blue-400";
}

function physicalStatusLabel(status: PhysicalStatus) {
  if (status === "DAMAGED") return "Danado";
  if (status === "LOST") return "Perdido";
  return "Buen estado";
}

function physicalStatusClass(status: PhysicalStatus) {
  if (status === "DAMAGED") {
    return "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50";
  }
  if (status === "LOST") {
    return "bg-red-100/80 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/50";
  }
  return "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50";
}

function loanStatusClass(status: LoanStatus) {
  if (status === "Activo") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }

  if (status === "Vencido") {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
}

function EmptyState({
  title,
  subtitle,
  tone = "info",
}: {
  title: string;
  subtitle: string;
  tone?: "info" | "error";
}) {
  return (
    <div className={`rounded-3xl border border-dashed p-8 text-center ${tone === "error" ? "border-red-300 bg-red-50/60 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" : "border-slate-300 bg-slate-50/50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/20 dark:text-slate-300"}`}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 shadow-sm">
        <BookX className="h-8 w-8 text-slate-500 dark:text-slate-400 animate-pulse"/>
      </div>
      <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{book.title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{book.author}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <DetailRow label="ISBN" value={book.isbn} />
          <DetailRow label="Editorial" value={book.publisher || "Sin especificar"} />
          <div className="rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 p-4 border border-blue-100 dark:border-slate-700">
            <p className="font-semibold mb-3 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-blue-600"/>
                Ubicación física
            </p>

          {book.storageLocation ? (
            // En bodega: al alumno solo le decimos "Bodega", sin el detalle
            // interno (caja, anaquel, etc.) que solo le sirve al bibliotecario
            // para ir a buscarlo. Si el alumno lo necesita, debe pedirlo en
            // el mostrador.
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span className="font-bold">Bodega</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">(pídelo en el mostrador)</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Pasillo</span>
                <span className="font-bold">{book.locationHall}</span>
              </div>

              <div className="mt-2 flex justify-between">
                <span>Estante</span>
                <span className="font-bold">{book.locationShelf}</span>
              </div>
            </>
          )}
        </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className={`inline-block rounded-full border px-5 py-2 text-sm font-bold ${book.available ? "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50" : "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50"}`}>
              {book.available ? "Disponible" : "Prestado"}
            </span>
            <span className={`inline-block rounded-full border px-5 py-2 text-sm font-bold ${physicalStatusClass(book.statusPhysical)}`}>
              {physicalStatusLabel(book.statusPhysical)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-2 last:border-0 dark:border-slate-800">
      <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
