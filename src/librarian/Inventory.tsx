import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  status: string;
}

export default function Inventory() {
  const [books, setBooks] = useState<Book[]>([
    {
      id: 1,
      isbn: "978-0132350884",
      title: "Clean Code",
      author: "Robert Martin",
      status: "Disponible",
    },
    {
      id: 2,
      isbn: "978-1492056355",
      title: "Learning React",
      author: "Alex Banks",
      status: "Prestado",
    },
  ]);

  const [search, setSearch] = useState("");

  const handleDelete = (id: number) => {
    setBooks(books.filter((book) => book.id !== id));
  };

  const handleEdit = (id: number) => {
    alert(`Editar libro ID: ${id}`);
  };

  const handleAddBook = () => {
    const newBook: Book = {
      id: books.length + 1,
      isbn: "000-0000000000",
      title: "Nuevo Libro",
      author: "Autor",
      status: "Disponible",
    };

    setBooks([...books, newBook]);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Inventario de Libros
        </h1>

        <button
          onClick={handleAddBook}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Nuevo Libro
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar libro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">

          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">ISBN</th>
              <th className="p-3 text-left">Título</th>
              <th className="p-3 text-left">Autor</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredBooks.map((book) => (
              <tr
                key={book.id}
                className="border-b hover:bg-slate-50"
              >
                <td className="p-3">{book.isbn}</td>

                <td className="p-3">{book.title}</td>

                <td className="p-3">{book.author}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      book.status === "Disponible"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {book.status}
                  </span>
                </td>

                <td className="p-3 text-center space-x-2">

                  <button
                    onClick={() => handleEdit(book.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(book.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Eliminar
                  </button>

                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </DashboardLayout>
  );
}