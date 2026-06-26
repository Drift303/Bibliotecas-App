import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";

// Interfaces alineadas a tus esquemas híbridos de Prisma
interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  status: string; // Unifica "Disponible" / "AVAILABLE" y "Prestado" / "LOANED"
}

export default function Inventory() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);

  // Mensaje de estado de conexión. Ahora es honesto: si dice error, es un error real.
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");

  // Bandera de error de guardado, para deshabilitar acciones si no hay backend
  const [actionError, setActionError] = useState("");

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    status: "Disponible",
  });

  // --- EFECTO DE CARGA ASÍNCRONA DESDE EL BACKEND ---
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
            : "Conectado al servidor. No hay libros registrados todavía."
        );
      } catch (err: any) {
        // Ya no hay datos falsos de respaldo. Si falla, se dice la verdad.
        setBooks([]);
        setStatusType("error");
        const detail = err?.response?.status
          ? `Error ${err.response.status} al contactar el servidor.`
          : "No se pudo conectar con el servidor (revisa CORS, backend o tu conexión).";
        setStatusMessage(detail);
        console.error("Error cargando libros:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  // --- CONTROLADORES DE EVENTOS ---
  const handleAddBook = () => {
    setEditingBookId(null);
    setActionError("");
    setFormData({ isbn: "", title: "", author: "", status: "Disponible" });
    setShowForm(true);
  };

  const handleEdit = (id: string | number) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    setEditingBookId(id);
    setActionError("");
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      status: book.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string | number) => {
    const confirmDelete = window.confirm("¿Deseas eliminar este libro del inventario?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/books/${id}`);
      // Solo actualizamos la tabla si el backend confirmó el borrado.
      setBooks(books.filter((book) => book.id !== id));
    } catch (err: any) {
      const detail = err?.response?.status
        ? `No se pudo eliminar (error ${err.response.status}).`
        : "No se pudo eliminar: sin conexión con el servidor.";
      alert(detail);
      console.error("Error eliminando libro:", err);
    }
  };

  const handleSaveBook = async () => {
    if (!formData.isbn || !formData.title || !formData.author) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    setActionError("");

    // Convertimos la selección visual a la lógica esperada por tus esquemas de Prisma
    const dbPayload = {
      isbn: formData.isbn,
      title: formData.title,
      author: formData.author,
      available: formData.status === "Disponible",
      status: formData.status === "Disponible" ? "AVAILABLE" : "LOANED",
      locationHall: "General",
      locationShelf: "A1",
    };

    try {
      if (editingBookId) {
        const res = await api.put(`/books/${editingBookId}`, dbPayload);
        const saved = res.data?.success ? res.data.data : res.data;

        setBooks(
          books.map((book) =>
            book.id === editingBookId
              ? { ...book, ...formData, id: saved?.id ?? book.id }
              : book
          )
        );
      } else {
        const res = await api.post("/books", dbPayload);
        const saved = res.data?.success ? res.data.data : res.data;

        // El id real viene del backend. Si por algo no viene, es un error, no se inventa uno.
        if (!saved?.id) {
          throw new Error("El servidor no devolvió un id válido para el libro nuevo.");
        }

        const newBook: Book = {
          id: saved.id,
          ...formData,
        };
        setBooks([...books, newBook]);
      }

      setShowForm(false);
    } catch (err: any) {
      const detail = err?.response?.status
        ? `No se pudo guardar (error ${err.response.status}). Revisa los datos o tu sesión.`
        : err?.message || "No se pudo guardar: sin conexión con el servidor.";
      setActionError(detail);
      console.error("Error guardando libro:", err);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#1E3A5F]">Inventario de Libros</h1>
          {statusMessage && (
            <p
              className={`text-sm mt-1 font-medium ${
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
        </div>

        <button
          onClick={handleAddBook}
          className="bg-[#1E3A5F] text-white px-5 py-3 rounded-xl transition-all duration-300 hover:bg-[#3B82F6] hover:shadow-lg hover:-translate-y-1"
        >
          + Nuevo Libro
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar libro por título, autor o ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        />
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
            {editingBookId ? "Editar Registro" : "Registrar Nuevo Libro"}
          </h2>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {actionError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="ISBN"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Título"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <input
              type="text"
              placeholder="Autor"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="border border-[#E5E7EB] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option>Disponible</option>
              <option>Prestado</option>
            </select>
          </div>

          {/* PRÓXIMAMENTE: CÓDIGO DE BARRAS */}
          <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium">Próximamente: Código de Barras</p>
          </div>
          <button className="w-full mt-2 border border-yellow-300 text-yellow-700 px-4 py-2 rounded-lg transition-colors hover:bg-yellow-50 font-medium">
            escaneo 
          </button>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSaveBook}
              className="bg-green-600 text-white px-5 py-2 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-5 py-2 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Vista de Carga */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 animate-pulse">Cargando inventario...</div>
      ) : books.length === 0 && statusType === "error" ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
          No se pudieron cargar los libros. {statusMessage}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1E3A5F] text-white">
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
                <tr key={book.id} className="border-b hover:bg-[#F8F9FB] transition-colors duration-200">
                  <td className="p-3 font-mono text-sm">{book.isbn}</td>
                  <td className="p-3 font-medium text-[#0F172A]">{book.title}</td>
                  <td className="p-3 text-gray-600">{book.author}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        book.status === "Disponible" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {book.status}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(book.id)}
                      className="bg-[#D4A017] text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}