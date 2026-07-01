import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from "lucide-react";

// Interfaces alineadas a tus esquemas híbridos de Prisma
interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  status: string; // Unifica "Disponible" / "AVAILABLE" y "Prestado" / "LOANED"
}

export default function Inventory() {
  const { isDark } = useTheme();
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? "text-blue-400" : "text-[#1E3A5F]"}`}>
            Inventario de Libros
          </h1>
          {statusMessage && (
            <p
              className={`text-sm mt-2 font-medium flex items-center gap-2 ${
                statusType === "error"
                  ? isDark ? "text-red-400" : "text-red-600"
                  : statusType === "ok"
                  ? isDark ? "text-green-400" : "text-green-600"
                  : isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {statusType === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {statusMessage}
            </p>
          )}
        </div>

        <button
          onClick={handleAddBook}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isDark
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-[#1E3A5F] text-white hover:bg-[#2d5a8e]"
          }`}
        >
          <Plus size={20} /> Nuevo Libro
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar libro por título, autor o ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
            isDark
              ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              : "bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          }`}
        />
      </div>

      {/* Formulario */}
      {showForm && (
        <div
          className={`p-6 rounded-lg border mb-6 transition-colors ${
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
            {editingBookId ? "Editar Registro" : "Registrar Nuevo Libro"}
          </h2>

          {actionError && (
            <div
              className={`flex gap-3 items-start p-3 rounded-lg mb-4 border ${
                isDark
                  ? "bg-red-900/20 border-red-700 text-red-200"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{actionError}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="ISBN"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />

            <input
              type="text"
              placeholder="Título"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />

            <input
              type="text"
              placeholder="Autor"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
              }`}
            >
              <option>Disponible</option>
              <option>Prestado</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveBook}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-all"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Vista de Carga */}
      {loading ? (
        <div className={`text-center py-10 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Cargando inventario...
        </div>
      ) : books.length === 0 && statusType === "error" ? (
        <div
          className={`rounded-lg p-6 text-center border ${
            isDark
              ? "bg-red-900/20 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          No se pudieron cargar los libros. {statusMessage}
        </div>
      ) : (
        <div
          className={`rounded-lg border overflow-hidden ${
            isDark
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <table className="w-full">
            <thead
              className={`${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              } border-b`}
            >
              <tr>
                <th className="p-3 text-left font-semibold">ISBN</th>
                <th className="p-3 text-left font-semibold">Título</th>
                <th className="p-3 text-left font-semibold">Autor</th>
                <th className="p-3 text-left font-semibold">Estado</th>
                <th className="p-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book, idx) => (
                <tr
                  key={book.id}
                  className={`border-b transition-colors ${
                    isDark
                      ? idx % 2 === 0
                        ? "bg-slate-900 hover:bg-slate-800"
                        : "bg-slate-800/50 hover:bg-slate-800"
                      : idx % 2 === 0
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <td className={`p-3 font-mono text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {book.isbn}
                  </td>
                  <td className={`p-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                    {book.title}
                  </td>
                  <td className={`p-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{book.author}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                        book.status === "Disponible"
                          ? isDark
                            ? "bg-green-900/30 text-green-300"
                            : "bg-green-100 text-green-700"
                          : isDark
                          ? "bg-amber-900/30 text-amber-300"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {book.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(book.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "text-amber-400 hover:bg-amber-900/30"
                            : "text-amber-600 hover:bg-amber-50"
                        }`}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "text-red-400 hover:bg-red-900/30"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBooks.length === 0 && (
            <div className={`p-8 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No hay libros para mostrar.
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}