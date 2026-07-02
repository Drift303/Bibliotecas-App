import { useEffect, useMemo, useState } from "react";
import api from "../api";
import BookCard from "../cards/BookCard";
import LogoutButton from "../components/LogoutButton";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";

interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  status: string; // "Disponible" o "Prestado"
}

export default function Catalog() {
  const [searchText, setSearchText] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");

  // --- EFECTO DE CARGA DESDE EL BACKEND ---
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      try {
        const res = await api.get("/books");

        // Desestructuración tolerante al formato de respuesta del backend
        const rawBooks = res.data?.success ? res.data.data : (res.data || []);

        const normalizedBooks = (Array.isArray(rawBooks) ? rawBooks : []).map((b: any) => ({
          id: b.id,
          isbn: b.isbn || "S/N",
          title: b.title,
          author: b.author,
          status:
            b.available === true || b.status === "AVAILABLE" || b.statusLogical === "ACTIVE"
              ? "Disponible"
              : "Prestado",
        }));

        setBooks(normalizedBooks);
        setStatusType("ok");
        setStatusMessage(
          normalizedBooks.length > 0
            ? "Datos sincronizados desde el servidor."
            : "Conectado al servidor. No hay libros disponibles todavía."
        );
      } catch (err: any) {
        setBooks([]);
        setStatusType("error");
        const detail = err?.response?.status
          ? `Error ${err.response.status} al contactar el servidor.`
          : "No se pudo conectar con el servidor (revisa tu conexión).";
        setStatusMessage(detail);
        console.error("Error cargando libros:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // --- BÚSQUEDA Y FILTRADO ---
  const filteredBooks = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return books;
    }

    return books.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query)
      );
    });
  }, [books, searchText]);

  return (
    <div className="relative min-h-screen p-6 md:p-8 transition-colors bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden">
      {/* Elementos decorativos tipo Mac (blurs dinámicos) */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Catálogo de Libros
          </h1>
          {statusMessage && (
            <p
              className={`text-sm font-medium ${
                statusType === "error"
                  ? "text-red-600 dark:text-red-400"
                  : statusType === "ok"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {statusMessage}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
            Explora la biblioteca, encuentra libros por título, autor o ISBN, y visualiza su estado al instante.
          </p>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-3">
          <div className="flex justify-end items-center gap-3">
            <ThemeToggleButton />
            <LogoutButton />
          </div>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="search">
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
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">
              Análisis🔎
            </span>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando catálogo...</div>
      ) : books.length === 0 && statusType === "error" ? (
        <div className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-md border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-3xl p-6 text-center font-medium shadow-sm">
          No se pudieron cargar los libros. {statusMessage}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-8 text-center text-slate-700 dark:text-slate-300">
              <p className="text-lg font-bold">No se encontraron libros</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Prueba con otro título, autor, ISBN o palabra clave.
              </p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}