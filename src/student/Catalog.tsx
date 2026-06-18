import { useMemo, useState } from "react";
import BookCard from "../cards/BookCard";

export default function Catalog() {
  const [searchText, setSearchText] = useState("");

  const books = [
    {
      id: 1,
      title: "Clean Code",
      author: "Robert C. Martin",
      status: "Disponible"
    },
    {
      id: 2,
      title: "React Básico",
      author: "Juan Pérez",
      status: "Prestado"
    }
  ];

  const filteredBooks = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return books;
    }

    return books.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });
  }, [books, searchText]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Catálogo de Libros
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Explora la biblioteca, encuentra libros por título o autor, y visualiza su estado al instante.
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-700">
            <p className="text-lg font-semibold">No se encontraron libros</p>
            <p className="mt-2 text-sm text-slate-500">
              Prueba con otro título, autor o palabra clave.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}