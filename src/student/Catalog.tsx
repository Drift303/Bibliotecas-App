import { useEffect, useMemo, useState } from "react";
import api from "../api";
import BookCard from "../cards/BookCard";

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
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
            Catálogo de Libros
          </h1>
          {statusMessage && (
            <p
              className={`text-sm font-medium ${
                statusType === "error"
                  ? "text-red-600"
                  : statusType === "ok"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {statusMessage}
            </p>
          )}
          <p className="text-sm text-slate-600 max-w-2xl mt-2">
            Explora la biblioteca, encuentra libros por título, autor o ISBN, y visualiza su estado al instante.
          </p>
        </div>

        <div className="w-full md:w-80">
          <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="search">
            Buscar libro
          </label>
          <div className="relative">
            <input
              id="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              type="text"
              placeholder="Ej. Clean Code o Robert C. Martin"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔎
            </span>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 animate-pulse">Cargando catálogo...</div>
      ) : books.length === 0 && statusType === "error" ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
          No se pudieron cargar los libros. {statusMessage}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-700">
              <p className="text-lg font-semibold">No se encontraron libros</p>
              <p className="mt-2 text-sm text-slate-500">
                Prueba con otro título, autor, ISBN o palabra clave.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}