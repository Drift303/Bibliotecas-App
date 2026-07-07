import { useEffect, useState, useRef } from "react";
import api from "../../api";
import * as XLSX from "xlsx";
import { useBarcodeScannerGun } from "./useBarcodeScannerGun";

interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  status: string;
}

export function useBookInventory() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");

  const [actionError, setActionError] = useState("");

  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    status: "Disponible",
  });

  const [showScanner, setShowScanner] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBookForBarcode, setSelectedBookForBarcode] = useState<Book | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // --- EFECTO DE CARGA ASÍNCRONA DESDE EL BACKEND ---
  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/books");

      const rawBooks = res.data?.success ? res.data.data : (res.data || []);

      const normalizedBooks = (Array.isArray(rawBooks) ? rawBooks : []).map((b: any) => ({
        id: b.id,
        isbn: b.isbn || "S/N",
        title: b.title,
        author: b.author,
        status:
          b.statusPhysical === "LOST"
            ? "Extraviado"
            : b.statusLogical === "DELETED_LOGICAL"
            ? "Eliminado"
            : b.available === true || b.status === "AVAILABLE" || b.statusLogical === "ACTIVE"
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

  useEffect(() => {
    loadBooks();
  }, []);

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

    const dbPayload = {
      isbn: formData.isbn,
      title: formData.title,
      author: formData.author,
      available: formData.status === "Disponible",
      status: formData.status === "Disponible" ? "AVAILABLE" : "LOANED",
      statusPhysical: formData.status === "Extraviado" ? "LOST" : "GOOD",
      statusLogical:
        formData.status === "Eliminado"
          ? "DELETED_LOGICAL"
          : formData.status === "Prestado"
          ? "BORROWED"
          : "ACTIVE",
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

  const searchLower = search.toLowerCase().trim();
  const exactIsbnMatch = books.filter(b => b.isbn && b.isbn.toLowerCase() === searchLower);

  const filteredBooks = exactIsbnMatch.length > 0
    ? exactIsbnMatch
    : books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          book.isbn.toLowerCase().includes(searchLower) ||
          book.id.toString().toLowerCase().includes(searchLower)
      );

  const handleScan = (decodedText: string) => {
    setSearch(decodedText);
    setShowScanner(false);
  };

  const handlePrintBarcode = (book: Book) => {
    setSelectedBookForBarcode(book);
    setShowBarcodeModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setActionError("");
    setStatusMessage("Procesando archivo...");
    setStatusType("info");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      let newBooksCount = 0;
      let errorsCount = 0;
      
      const headers = rawJson[0]?.map((h: string) => h?.toString().toLowerCase() || "") || [];
      const isbnIdx = headers.findIndex((h) => h.includes("isbn") || h.includes("código"));
      const titleIdx = headers.findIndex((h) => h.includes("título") || h.includes("title") || h.includes("nombre"));
      const authorIdx = headers.findIndex((h) => h.includes("autor") || h.includes("author"));
      const statusIdx = headers.findIndex((h) => h.includes("estado") || h.includes("status"));

      const iIdx = isbnIdx >= 0 ? isbnIdx : 0;
      const tIdx = titleIdx >= 0 ? titleIdx : 1;
      const aIdx = authorIdx >= 0 ? authorIdx : 2;
      const sIdx = statusIdx >= 0 ? statusIdx : 3;

      for (let i = 1; i < rawJson.length; i++) {
        const row = rawJson[i];
        if (!row || row.length === 0 || (!row[iIdx] && !row[tIdx])) continue;

        const isbn = row[iIdx]?.toString() || "S/N";
        const title = row[tIdx]?.toString() || "Desconocido";
        const author = row[aIdx]?.toString() || "Desconocido";
        const rawStatus = row[sIdx]?.toString().toLowerCase() || "disponible";
        const isAvailable = rawStatus.includes("disponible") || rawStatus === "available";

        const dbPayload = {
          isbn,
          title,
          author,
          available: isAvailable,
          status: isAvailable ? "AVAILABLE" : "LOANED",
          statusPhysical: "GOOD",
          statusLogical: "ACTIVE",
          locationHall: "General",
          locationShelf: "A1",
        };

        try {
          await api.post("/books", dbPayload);
          newBooksCount++;
        } catch (err) {
          console.error("Error guardando fila", i, err);
          errorsCount++;
        }
      }

      setStatusType(errorsCount === 0 ? "ok" : "info");
      setStatusMessage(`Carga masiva completada: ${newBooksCount} libros añadidos. ${errorsCount > 0 ? `(${errorsCount} no se pudieron añadir)` : ""}`);
      
      const res = await api.get("/books");
      const loadedBooks = res.data?.success ? res.data.data : (res.data || []);
      setBooks((Array.isArray(loadedBooks) ? loadedBooks : []).map((b: any) => ({
        id: b.id,
        isbn: b.isbn || "S/N",
        title: b.title,
        author: b.author,
        status:
          b.statusPhysical === "LOST"
            ? "Extraviado"
            : b.statusLogical === "DELETED_LOGICAL"
            ? "Eliminado"
            : b.available === true || b.status === "AVAILABLE" || b.statusLogical === "ACTIVE"
            ? "Disponible"
            : "Prestado",
      })));
      
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      setStatusType("error");
      setStatusMessage("Hubo un problema procesando el archivo. Verifica que sea un formato válido (.xlsx o .csv).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- INTEGRACIÓN PISTOLA LECTORA ---
  useBarcodeScannerGun((barcode) => {
    if (showForm) {
      setFormData((prev) => ({ ...prev, isbn: barcode }));
      // Enfocar automáticamente el campo para conveniencia
      setTimeout(() => {
        document.getElementById("isbn-input")?.focus();
      }, 50);
    } else {
      setSearch(barcode);
    }
  });

  return {
    books,
    search,
    setSearch,
    showForm,
    setShowForm,
    editingBookId,
    loading,
    statusMessage,
    statusType,
    actionError,
    formData,
    setFormData,
    showScanner,
    setShowScanner,
    uploading,
    fileInputRef,
    selectedBookForBarcode,
    showBarcodeModal,
    setShowBarcodeModal,
    setSelectedBookForBarcode,
    filteredBooks,
    handleAddBook,
    handleEdit,
    handleDelete,
    handleSaveBook,
    handleScan,
    handlePrintBarcode,
    handleFileUpload,
  };
}
