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

export interface ColumnMapping {
  isbn: number;
  title: number;
  author: number;
  status: number;
}

// Función para sanitizar texto: elimina espacios extra y quita comillas molestas
export const sanitizeString = (val: any): string => {
  if (val === null || val === undefined) return "";
  let str = val.toString().trim();
  // Remover comillas dobles o simples al inicio y final
  str = str.replace(/^["']+|["']+$/g, "");
  return str.trim();
};

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

  const [selectedBooksForBarcode, setSelectedBooksForBarcode] = useState<Book[]>([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const [uploadConflicts, setUploadConflicts] = useState<any[]>([]);
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // States for Column Mapper
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
  const [uploadRawData, setUploadRawData] = useState<any[][]>([]);

  const [selectedBooksToPrint, setSelectedBooksToPrint] = useState<Set<string | number>>(new Set());

  const handleToggleSelectBook = (id: string | number) => {
    const newSelected = new Set(selectedBooksToPrint);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBooksToPrint(newSelected);
  };

  const handleSelectAllBooks = (ids: (string | number)[]) => {
    if (selectedBooksToPrint.size > 0 && selectedBooksToPrint.size === ids.length) {
      setSelectedBooksToPrint(new Set());
    } else {
      setSelectedBooksToPrint(new Set(ids));
    }
  };

  const confirmUpload = async (itemsToUpload: any[]) => {
    setUploading(true);
    setStatusMessage("Guardando libros en el inventario de forma masiva...");
    setStatusType("info");
    setShowUploadModal(false);

    let newBooksCount = 0;
    let errorsCount = 0;

    // Enviar en bloques más grandes para máxima velocidad
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < itemsToUpload.length; i += CHUNK_SIZE) {
      const chunk = itemsToUpload.slice(i, i + CHUNK_SIZE);
      try {
        const res = await api.post("/books/bulk", { books: chunk });
        newBooksCount += res.data?.data?.count || chunk.length;
      } catch (err) {
        console.error("Error guardando bloque de libros", err);
        errorsCount++;
      }
    }

    setStatusType(errorsCount === 0 ? "ok" : "info");
    setStatusMessage(`Carga masiva completada: ${newBooksCount} libros añadidos. ${errorsCount > 0 ? `(Hubo errores en ${errorsCount} bloques)` : ""}`);
    
    loadBooks();
    setUploading(false);
  };

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
    const exactMatch = books.find(b => b.isbn && b.isbn.toLowerCase() === decodedText.toLowerCase());
    if (exactMatch) {
      handleEdit(exactMatch.id);
      setSearch("");
    } else {
      setSearch(decodedText);
    }
    setShowScanner(false);
  };

  const handlePrintBarcode = (book: Book) => {
    setSelectedBooksForBarcode([book]);
    setShowBarcodeModal(true);
  };

  const handlePrintSelected = () => {
    const selected = books.filter(b => selectedBooksToPrint.has(b.id));
    setSelectedBooksForBarcode(selected);
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
      
      if (rawJson.length < 2) {
        throw new Error("El archivo parece estar vacío o no tiene suficientes datos.");
      }

      const headers = rawJson[0]?.map((h: any) => sanitizeString(h)) || [];
      
      setUploadHeaders(headers);
      setUploadRawData(rawJson);
      setShowColumnMapper(true);
      
    } catch (error) {
      console.error("Error al leer el archivo Excel:", error);
      setStatusType("error");
      setStatusMessage("Hubo un problema leyendo el archivo. Verifica que sea un formato válido (.xlsx o .csv).");
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const processMappedData = async (mapping: ColumnMapping) => {
    setShowColumnMapper(false);
    setUploading(true);
    setStatusMessage("Procesando filas y detectando duplicados...");
    setStatusType("info");

    try {
      const conflicts: any[] = [];
      const ready: any[] = [];
      const rawJson = uploadRawData;

      // Optimización O(1) para búsquedas de duplicados (evita congelamiento en >8000 filas)
      const existingIsbns = new Map();
      const existingTitles = new Map();
      
      books.forEach(b => {
        if (b.isbn && b.isbn !== "S/N") {
          existingIsbns.set(b.isbn.toLowerCase(), b);
        }
        if (b.title) {
          existingTitles.set(b.title.toLowerCase(), b);
        }
      });

      // Iniciamos en 1 para omitir encabezados
      for (let i = 1; i < rawJson.length; i++) {
        const row = rawJson[i];
        if (!row || row.length === 0) continue;

        // Sanitizar y extraer según el mapeo del usuario
        const isbn = mapping.isbn >= 0 ? sanitizeString(row[mapping.isbn]) : "S/N";
        const title = mapping.title >= 0 ? sanitizeString(row[mapping.title]) : "Desconocido";
        const author = mapping.author >= 0 ? sanitizeString(row[mapping.author]) : "Desconocido";
        
        // Si no hay titulo y no hay isbn, es una fila vacía
        if (!title && (!isbn || isbn === "S/N")) continue;

        const rawStatus = mapping.status >= 0 ? sanitizeString(row[mapping.status]).toLowerCase() : "disponible";
        const isAvailable = rawStatus.includes("disponible") || rawStatus === "available";

        const dbPayload = {
          isbn: isbn || "S/N",
          title: title || "Desconocido",
          author: author || "Desconocido",
          available: isAvailable,
          statusPhysical: "GOOD",
          statusLogical: "ACTIVE",
          locationHall: "General",
          locationShelf: "A1",
        };

        const dupByIsbn = (dbPayload.isbn !== "S/N") ? existingIsbns.get(dbPayload.isbn.toLowerCase()) : null;
        const dupByTitle = existingTitles.get(dbPayload.title.toLowerCase());
        const isDuplicate = dupByIsbn || dupByTitle;

        if (isDuplicate) {
          conflicts.push({ ...dbPayload, duplicateReason: `Ya existe un libro llamado "${isDuplicate.title}" (ISBN: ${isDuplicate.isbn})` });
        } else {
          ready.push(dbPayload);
          // Opcional: Agregar al Map temporalmente para detectar duplicados *dentro del mismo Excel*
          if (dbPayload.isbn !== "S/N") existingIsbns.set(dbPayload.isbn.toLowerCase(), dbPayload);
          existingTitles.set(dbPayload.title.toLowerCase(), dbPayload);
        }
      }

      if (conflicts.length > 0) {
        setUploadConflicts(conflicts);
        setPendingUploads(ready);
        setShowUploadModal(true);
        setStatusMessage("Se detectaron libros duplicados. Por favor revisa la información.");
        setStatusType("info");
      } else {
        await confirmUpload(ready);
      }
      
    } catch (error) {
      console.error("Error al procesar datos mapeados:", error);
      setStatusType("error");
      setStatusMessage("Hubo un problema procesando las filas.");
      setUploading(false);
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
    selectedBooksForBarcode,
    showBarcodeModal,
    setShowBarcodeModal,
    setSelectedBooksForBarcode,
    filteredBooks,
    handleAddBook,
    handleEdit,
    handleDelete,
    handleSaveBook,
    handleScan,
    handlePrintBarcode,
    handlePrintSelected,
    handleFileUpload,
    uploadConflicts,
    pendingUploads,
    showUploadModal,
    setShowUploadModal,
    confirmUpload,
    selectedBooksToPrint,
    setSelectedBooksToPrint,
    handleToggleSelectBook,
    handleSelectAllBooks,
    showColumnMapper,
    setShowColumnMapper,
    uploadHeaders,
    uploadRawData,
    processMappedData,
  };
}
