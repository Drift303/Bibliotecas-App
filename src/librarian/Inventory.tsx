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

  const [showForm, setShowForm] = useState(false);

  const [editingBookId, setEditingBookId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    status: "Disponible",
  });

  const handleAddBook = () => {
    setEditingBookId(null);

    setFormData({
      isbn: "",
      title: "",
      author: "",
      status: "Disponible",
    });

    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const book = books.find((b) => b.id === id);

    if (!book) return;

    setEditingBookId(id);

    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      status: book.status,
    });

    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar este libro?"
    );

    if (!confirmDelete) return;

    setBooks(
      books.filter((book) => book.id !== id)
    );
  };

  const handleSaveBook = () => {
    if (
      !formData.isbn ||
      !formData.title ||
      !formData.author
    ) {
      alert("Completa todos los campos");
      return;
    }

    if (editingBookId) {
      setBooks(
        books.map((book) =>
          book.id === editingBookId
            ? {
                ...book,
                ...formData,
              }
            : book
        )
      );
    } else {
      const newBook: Book = {
        id: Date.now(),
        ...formData,
      };

      setBooks([...books, newBook]);
    }

    setShowForm(false);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      book.author
        .toLowerCase()
        .includes(search.toLowerCase()) ||
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
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
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

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">

          <h2 className="text-xl font-semibold mb-4">
            {editingBookId
              ? "Editar Libro"
              : "Nuevo Libro"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="ISBN"
              value={formData.isbn}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isbn: e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Título"
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Autor"
              value={formData.author}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  author: e.target.value,
                })
              }
              className="border p-2 rounded"
            />

            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value,
                })
              }
              className="border p-2 rounded"
            >
              <option>Disponible</option>
              <option>Prestado</option>
            </select>

          </div>

          <div className="flex gap-3 mt-4">

            <button
              onClick={handleSaveBook}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Guardar
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>

          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">

          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">ISBN</th>
              <th className="p-3 text-left">Título</th>
              <th className="p-3 text-left">Autor</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredBooks.map((book) => (
              <tr
                key={book.id}
                className="border-b hover:bg-slate-50"
              >
                <td className="p-3">
                  {book.isbn}
                </td>

                <td className="p-3">
                  {book.title}
                </td>

                <td className="p-3">
                  {book.author}
                </td>

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
                    onClick={() =>
                      handleEdit(book.id)
                    }
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(book.id)
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
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