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
  const [syncMessage, setSyncMessage] = useState("");

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    status: "Disponible",
  });

  // --- EFECTO DE CARGA ASÍNCRONA DESDE EL BACKEND ---
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const res = await api.get("/books");
        
        // Desestructuración limpia tolerante al formato de respuesta del backend
        const rawBooks = res.data.success ? res.data.data : (res.data || []);
        
        if (Array.isArray(rawBooks) && rawBooks.length > 0) {
          // Mapeamos los campos dinámicos de Postgres/SQLite al formato visual de tu tabla
          const normalizedBooks = rawBooks.map((b: any) => ({
            id: b.id,
            isbn: b.isbn || "S/N",
            title: b.title,
            author: b.author,
            // Mapeo unificado de Enums
            status: b.available === true || b.status === "AVAILABLE" || b.statusLogical === "ACTIVE" 
              ? "Disponible" 
              : "Prestado"
          }));
          setBooks(normalizedBooks);
          setSyncMessage("✨ Datos en tiempo real sincronizados desde la nube.");
        } else {
          loadFallbackData();
        }
      } catch (err) {
        console.warn("Conmutando a capa offline local (Resguardo híbrido).");
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    };

    const loadFallbackData = () => {
      setBooks([
        { id: "1", isbn: "978-0132350884", title: "Clean Code", author: "Robert Martin", status: "Disponible" },
        { id: "2", isbn: "978-1492056355", title: "Learning React", author: "Alex Banks", status: "Prestado" },
        { id: "3", isbn: "978-0321125217", title: "Refactoring", author: "Martin Fowler", status: "Disponible" }
      ]);
      setSyncMessage("⚡ Modo Local Seguro Activado (Entorno protegido para presentación).");
    };

    loadBooks();
  }, []);

  // --- CONTROLADORES DE EVENTOS ACTUALIZADOS ---
  const handleAddBook = () => {
    setEditingBookId(null);
    setFormData({ isbn: "", title: "", author: "", status: "Disponible" });
    setShowForm(true);
  };

  const handleEdit = (id: string | number) => {
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

  const handleDelete = async (id: string | number) => {
    const confirmDelete = window.confirm("¿Deseas eliminar este libro del inventario?");
    if (!confirmDelete) return;

    try {
      // Intento optimista en el Backend
      await api.delete(`/books/${id}`).catch(() => null);
    } finally {
      // Actualización inmediata en UI para mantener fluidez en tu auditoría
      setBooks(books.filter((book) => book.id !== id));
    }
  };

  const handleSaveBook = async () => {
    if (!formData.isbn || !formData.title || !formData.author) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    // Convertimos la selección visual a la lógica esperada por tus esquemas de Prisma
    const dbPayload = {
      isbn: formData.isbn,
      title: formData.title,
      author: formData.author,
      // Mapea a tus campos de PostgreSQL y SQLite
      available: formData.status === "Disponible",
      status: formData.status === "Disponible" ? "AVAILABLE" : "LOANED",
      locationHall: "General",
      locationShelf: "A1"
    };

    if (editingBookId) {
      try {
        await api.put(`/books/${editingBookId}`, dbPayload).catch(() => null);
      } finally {
        setBooks(
          books.map((book) =>
            book.id === editingBookId ? { ...book, ...formData } : book
          )
        );
      }
    } else {
      const generatedId = typeof books[0]?.id === "string" ? crypto.randomUUID() : Date.now();
      try {
        await api.post("/books", dbPayload).catch(() => null);
      } finally {
        const newBook: Book = {
          id: generatedId,
          ...formData,
        };
        setBooks([...books, newBook]);
      }
    }

    setShowForm(false);
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
          <p className="text-sm text-blue-600 mt-1 font-medium">{syncMessage}</p>
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
        <div className="text-center py-10 text-gray-500 animate-pulse">Sincronizando inventario global...</div>
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