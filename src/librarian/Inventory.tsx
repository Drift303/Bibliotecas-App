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
      <div className="bg-[#F8F9FB] min-h-screen">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#1E3A5F]">
              Inventario de Libros
            </h1>

            <p className="text-gray-500 mt-1">
              Gestión y administración del catálogo bibliotecario
            </p>
          </div>

          <button
            onClick={handleAddBook}
            className="
              bg-[#1E3A5F]
              text-white
              px-5
              py-3
              rounded-xl
              transition-all
              duration-300
              hover:bg-[#3B82F6]
              hover:shadow-lg
              hover:-translate-y-1
            "
          >
            + Nuevo Libro
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por ISBN, título o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              border
              border-[#E5E7EB]
              rounded-xl
              p-3
              shadow-sm
              focus:outline-none
              focus:ring-2
              focus:ring-[#3B82F6]
            "
          />
        </div>

        {showForm && (
          <div
            className="
              bg-white
              p-6
              rounded-2xl
              shadow-sm
              border
              border-[#E5E7EB]
              mb-6
            "
          >
            <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
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
                className="border border-gray-300 p-3 rounded-xl"
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
                className="border border-gray-300 p-3 rounded-xl"
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
                className="border border-gray-300 p-3 rounded-xl"
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value,
                  })
                }
                className="border border-gray-300 p-3 rounded-xl"
              >
                <option>Disponible</option>
                <option>Prestado</option>
              </select>

            </div>

            <div className="flex gap-3 mt-5">

              <button
                onClick={handleSaveBook}
                className="
                  bg-green-600
                  text-white
                  px-5
                  py-2
                  rounded-xl
                  transition-all
                  duration-300
                  hover:shadow-md
                  hover:-translate-y-1
                "
              >
                Guardar
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="
                  bg-gray-500
                  text-white
                  px-5
                  py-2
                  rounded-xl
                  transition-all
                  duration-300
                  hover:shadow-md
                  hover:-translate-y-1
                "
              >
                Cancelar
              </button>

            </div>
          </div>
        )}

        <div
          className="
            bg-white
            rounded-2xl
            shadow-sm
            border
            border-[#E5E7EB]
            overflow-hidden
          "
        >
          <table className="w-full">

            <thead className="bg-[#1E3A5F] text-white">
              <tr>
                <th className="p-4 text-left">ISBN</th>
                <th className="p-4 text-left">Título</th>
                <th className="p-4 text-left">Autor</th>
                <th className="p-4 text-left">Estado</th>
                <th className="p-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  className="
                    border-b
                    hover:bg-[#F8F9FB]
                    transition-colors
                    duration-200
                  "
                >
                  <td className="p-4">
                    {book.isbn}
                  </td>

                  <td className="p-4 font-medium">
                    {book.title}
                  </td>

                  <td className="p-4">
                    {book.author}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        book.status === "Disponible"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {book.status}
                    </span>

                  </td>

                  <td className="p-4 text-center space-x-2">

                    <button
                      onClick={() =>
                        handleEdit(book.id)
                      }
                      className="
                        bg-[#D4A017]
                        text-white
                        px-3
                        py-1
                        rounded-lg
                        transition-all
                        duration-300
                        hover:shadow-md
                        hover:-translate-y-1
                      "
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(book.id)
                      }
                      className="
                        bg-red-600
                        text-white
                        px-3
                        py-1
                        rounded-lg
                        transition-all
                        duration-300
                        hover:shadow-md
                        hover:-translate-y-1
                      "
                    >
                      Eliminar
                    </button>

                  </td>
                </tr>
              ))}

            </tbody>

          </table>
        </div>

      </div>
    </DashboardLayout>
  );
}