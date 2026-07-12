import { useEffect, useMemo, useState } from "react";
import api from "../api";
import BookCard from "../cards/BookCard";
import LogoutButton from "../components/LogoutButton";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import { BookX} from "lucide-react";

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
  available: boolean;
  status: "Disponible" | "Prestado";
  statusPhysical: PhysicalStatus;
}

interface Loan {
  id: string;
  book: string;
  loanDate: string;
  dueDate: string;
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
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");
  const [loanStatusMessage, setLoanStatusMessage] = useState("");

  useEffect(() => {
    const loadBooks = async () => {
      setLoadingBooks(true);
      try {
        const res = await api.get("/books");
        const rawBooks = res.data?.success ? res.data.data : res.data || [];
        const normalizedBooks = (Array.isArray(rawBooks) ? rawBooks : []).map(mapBook);

        setBooks(normalizedBooks);
        setStatusType("ok");
        setStatusMessage(
          normalizedBooks.length > 0
            ? "Datos sincronizados desde el servidor."
            : "Conectado al servidor. No hay libros disponibles todavia."
        );
      } catch (err: any) {
        setBooks([]);
        setStatusType("error");
        const detail = err?.response?.status
          ? `Error ${err.response.status} al contactar el servidor.`
          : "No se pudo conectar con el servidor. Revisa tu conexion.";
        setStatusMessage(detail);
        console.error("Error cargando libros:", err);
      } finally {
        setLoadingBooks(false);
      }
    };

    const loadLoans = async () => {
      setLoadingLoans(true);
      try {
        const res = await api.get("/loans");
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setLoans(data.map(mapLoan));
        setLoanStatusMessage("");
      } catch (err) {
        setLoans([]);
        setStatusMessage("No se pudieron cargar los prestamos");
        setStatusType("error");
        setLoanStatusMessage("No se pudieron cargar los prestamos");
      } finally {
        setLoadingLoans(false);
      }
    };

    loadBooks();
    loadLoans();
  }, []);

  const filteredBooks = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return books
      .filter((book) =>
        filter === "todos" ? true : filter === "disponibles" ? book.available : !book.available
      )
      .filter((book) => {
        if (!query) return true;
        return (
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn.toLowerCase().includes(query)
        );
      });
  }, [books, filter, searchText]);

  const totalFines = loans.reduce((total, loan) => total + loan.fine, 0);

  return (
    <div className="relative min-h-screen p-6 md:p-8 transition-colors bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden">
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              Catalogo de Libros
            </h1>
            {statusMessage && (
              <p className={`text-sm font-medium ${statusTextClass(statusType)}`}>
                {statusMessage}
              </p>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
              Explora la biblioteca, encuentra libros por titulo, autor o ISBN, y visualiza su estado al instante.
            </p>
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
                onChange={(event) => setSearchText(event.target.value)}
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

        <div className="mb-6 flex flex-wrap gap-3">
          {[
            { value: "todos", label: "Todos" },
            { value: "disponibles", label: "Disponibles" },
            { value: "prestados", label: "Prestados" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value as AvailabilityFilter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item.value
                  ? "bg-blue-700 text-white shadow-sm"
                  : "border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
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
        ) : filteredBooks.length === 0 ? (
          <EmptyState
            title="No se encontraron libros"
            subtitle="Prueba con otro titulo, autor, ISBN o cambia el filtro activo."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}

        <section className="mt-12">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Historial de prestamos
              </h2>
              {loanStatusMessage && (
                <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                  {loanStatusMessage}
                </p>
              )}
            </div>
            <div className={`rounded-2xl px-4 py-2 text-sm font-bold ${totalFines > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
              Multas: {money.format(totalFines)}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <tr>
                    <th className="p-3 text-left font-semibold">Libro</th>
                    <th className="p-3 text-left font-semibold">Fecha prestamo</th>
                    <th className="p-3 text-left font-semibold">Fecha devolucion</th>
                    <th className="p-3 text-left font-semibold">Estado</th>
                    <th className="p-3 text-left font-semibold">Multa</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, index) => (
                    <tr
                      key={loan.id}
                      className={`border-b border-slate-100 transition-colors dark:border-slate-800 ${
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

                  {!loadingLoans && loans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center font-medium text-slate-500 dark:text-slate-400">
                        No tienes prestamos registrados.
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
  if (status === "Activo") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  if (status === "Vencido") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
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
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-current opacity-70">
        <BookX className="h-5 w-5"/>
      </div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/80">
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
            <span aria-hidden="true" className="text-lg leading-none">
              x
            </span>
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <DetailRow label="ISBN" value={book.isbn} />
          <DetailRow label="Editorial" value={book.publisher || "Sin especificar"} />
          <DetailRow label="Pasillo" value={book.locationHall} />
          <DetailRow label="Estante" value={book.locationShelf} />

          <div className="flex flex-wrap gap-2 pt-2">
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${book.available ? "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50" : "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50"}`}>
              {book.available ? "Disponible" : "Prestado"}
            </span>
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${physicalStatusClass(book.statusPhysical)}`}>
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
