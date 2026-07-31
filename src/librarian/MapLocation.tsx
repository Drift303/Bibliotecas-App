import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import api from "../api";
import { useBarcodeScannerGun } from "./hooks/useBarcodeScannerGun";
import { BarcodeScanner } from "../components/ui/BarcodeScanner";
import {
  MapPin,
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  Save,
  BookX,
  X,
} from "lucide-react";

interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  locationHall?: string | null;
  locationShelf?: string | null;
  locationRow?: string | null;
  locationColumn?: string | null;
  storageLocation?: string | null;
}

type LocationType = "SHELF" | "STORAGE";
type FilterMode = "all" | "unmapped" | "mapped";

const isMapped = (b: Book) =>
  Boolean(
    (b.locationHall && b.locationHall.trim()) ||
      (b.locationShelf && b.locationShelf.trim()) ||
      (b.locationRow && b.locationRow.trim()) ||
      (b.locationColumn && b.locationColumn.trim()) ||
      (b.storageLocation && b.storageLocation.trim())
  );

const describeLocation = (b: Book): string => {
  if (b.storageLocation && b.storageLocation.trim()) {
    return `Almacén · ${b.storageLocation}`;
  }
  const parts: string[] = [];
  if (b.locationHall) parts.push(`Pasillo ${b.locationHall}`);
  if (b.locationShelf) parts.push(`Estante ${b.locationShelf}`);
  if (b.locationRow) parts.push(`Fila ${b.locationRow}`);
  if (b.locationColumn) parts.push(`Col. ${b.locationColumn}`);
  return parts.length ? parts.join(" · ") : "—";
};

export default function MapLocation() {
  const { isDark } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscador: filtra la tabla en vivo por ISBN/título/autor. Un match exacto
  // de ISBN (por escaneo o Enter) abre directo el editor.
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [notFoundCode, setNotFoundCode] = useState("");

  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Editor de ubicación: vive en un modal aparte para no amontonar la pantalla.
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [locationType, setLocationType] = useState<LocationType>("SHELF");
  const [form, setForm] = useState({
    locationHall: "",
    locationShelf: "",
    locationRow: "",
    locationColumn: "",
    storageLocation: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/books");
      const rawBooks = res.data?.success ? res.data.data : res.data || [];
      setBooks(Array.isArray(rawBooks) ? rawBooks : []);
    } catch (err) {
      console.error("Error cargando libros para mapeo de ubicación:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (book: Book) => {
    setSelectedBook(book);
    setNotFoundCode("");
    setLocationType(book.storageLocation && book.storageLocation.trim() ? "STORAGE" : "SHELF");
    setForm({
      locationHall: book.locationHall || "",
      locationShelf: book.locationShelf || "",
      locationRow: book.locationRow || "",
      locationColumn: book.locationColumn || "",
      storageLocation: book.storageLocation || "",
    });
  };

  const closeEditor = () => setSelectedBook(null);

  // Solo un código exacto (escaneo o Enter) intenta abrir el editor directo.
  const handleScanCode = (code: string) => {
    const codeLower = code.toLowerCase().trim();
    const match = books.find((b) => b.isbn && b.isbn.toLowerCase() === codeLower);
    setShowScanner(false);
    if (match) {
      openEditor(match);
      setSearch("");
    } else {
      setNotFoundCode(code);
    }
  };

  useBarcodeScannerGun((barcode) => handleScanCode(barcode));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) handleScanCode(search.trim());
  };

  const handleSaveLocation = async () => {
    if (!selectedBook) return;
    setSaving(true);
    try {
      const payload =
        locationType === "SHELF"
          ? {
              locationHall: form.locationHall.trim() || null,
              locationShelf: form.locationShelf.trim() || null,
              locationRow: form.locationRow.trim() || null,
              locationColumn: form.locationColumn.trim() || null,
              storageLocation: null,
            }
          : {
              locationHall: null,
              locationShelf: null,
              locationRow: null,
              locationColumn: null,
              // Opcional: si no se especifica detalle, se guarda como "Bodega" genérico.
              storageLocation: form.storageLocation.trim() || "Bodega",
            };

      await api.put(`/books/${selectedBook.id}`, payload);

      setBooks((prev) => prev.map((b) => (b.id === selectedBook.id ? { ...b, ...payload } : b)));
      setToast(`Ubicación guardada: ${selectedBook.title}`);
      closeEditor();
    } catch (err) {
      console.error("Error guardando ubicación:", err);
      alert("No se pudo guardar la ubicación. Verifica tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  const mappedBooks = useMemo(() => books.filter(isMapped), [books]);
  const unmappedBooks = useMemo(() => books.filter((b) => !isMapped(b)), [books]);

  const filteredBooks = useMemo(() => {
    let list = books;
    if (filterMode === "mapped") list = mappedBooks;
    if (filterMode === "unmapped") list = unmappedBooks;

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q)
    );
  }, [books, mappedBooks, unmappedBooks, filterMode, search]);

  const progressPercentage = books.length === 0 ? 0 : Math.round((mappedBooks.length / books.length) * 100);

  const inputClass = `w-full px-4 py-2 rounded-lg border transition-colors ${
    isDark
      ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
  }`;
  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-1 ${
    isDark ? "text-slate-400" : "text-slate-500"
  }`;

  const tabButtonClass = (active: boolean, activeColor: string) =>
    `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
      active
        ? activeColor
        : isDark
        ? "text-slate-400 hover:text-slate-200"
        : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <DashboardLayout>
      {/* Encabezado, breve */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-slate-800"}`}>
            <MapPin className={isDark ? "text-blue-400" : "text-blue-600"} size={26} />
            Mapear Ubicación
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Escanea, busca o haz clic en un libro de la lista para asignarle su ubicación.
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {mappedBooks.length} / {books.length} ubicados
          </p>
          <div className="w-40 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                progressPercentage === 100 ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Buscador: una sola fila, un solo trabajo */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} size={18} />
          <input
            type="text"
            placeholder="Escanea un código, o escribe título, autor o ISBN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setNotFoundCode("");
            }}
            autoFocus
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl outline-none transition-all text-sm ${
              isDark
                ? "bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/40 border border-slate-800 focus:border-blue-500"
                : "bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 border border-slate-200 focus:border-blue-400"
            }`}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className={`p-2.5 rounded-xl transition-all ${
            isDark
              ? "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
          title="Usar cámara del dispositivo"
        >
          <Camera size={20} />
        </button>
      </form>

      {notFoundCode && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${isDark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
          <AlertTriangle className={isDark ? "text-amber-500" : "text-amber-600"} size={18} />
          <p className={`text-sm ${isDark ? "text-amber-500/80" : "text-amber-700"}`}>
            El código <strong>{notFoundCode}</strong> no existe en el sistema. Regístralo desde Inventario o la Auditoría Anual.
          </p>
        </div>
      )}

      {/* Filtro por estado: pills compactos, no una barra pesada */}
      <div className="flex items-center gap-1.5 mb-3">
        <button onClick={() => setFilterMode("all")} className={tabButtonClass(filterMode === "all", isDark ? "bg-slate-800 text-white" : "bg-slate-800 text-white")}>
          Todos <span className="opacity-60">· {books.length}</span>
        </button>
        <button onClick={() => setFilterMode("unmapped")} className={tabButtonClass(filterMode === "unmapped", isDark ? "bg-amber-900/40 text-amber-400" : "bg-amber-100 text-amber-700")}>
          Sin ubicar <span className="opacity-60">· {unmappedBooks.length}</span>
        </button>
        <button onClick={() => setFilterMode("mapped")} className={tabButtonClass(filterMode === "mapped", isDark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-700")}>
          Ubicados <span className="opacity-60">· {mappedBooks.length}</span>
        </button>
      </div>

      {/* Lista: espaciada, sin rayado de cebra, solo separadores finos */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b text-xs uppercase tracking-wider ${isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
              <th className="p-3.5 text-left font-medium w-28"></th>
              <th className="p-3.5 text-left font-medium">Título</th>
              <th className="p-3.5 text-left font-medium">ISBN</th>
              <th className="p-3.5 text-left font-medium">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-500">Cargando libros...</td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-500">No hay libros que coincidan.</td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  onClick={() => openEditor(book)}
                  className={`border-b last:border-0 cursor-pointer transition-colors ${
                    isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <td className="p-3.5">
                    {isMapped(book) ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        <CheckCircle2 size={14} /> Ubicado
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                        <BookX size={14} /> Sin ubicar
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <p className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{book.title}</p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{book.author}</p>
                  </td>
                  <td className={`p-3.5 font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{book.isbn}</td>
                  <td className={`p-3.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{describeLocation(book)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor de ubicación: modal aparte, se cierra solo al guardar */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeEditor}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-800"}`}>{selectedBook.title}</h3>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {selectedBook.author} · ISBN {selectedBook.isbn}
                </p>
              </div>
              <button
                onClick={closeEditor}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className={`flex gap-1 p-1 rounded-lg mb-5 ${isDark ? "bg-slate-800/60" : "bg-slate-100"}`}>
              <button
                type="button"
                onClick={() => setLocationType("SHELF")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${
                  locationType === "SHELF"
                    ? isDark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-800 shadow"
                    : isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Layers size={16} /> En estante
              </button>
              <button
                type="button"
                onClick={() => setLocationType("STORAGE")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${
                  locationType === "STORAGE"
                    ? isDark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-800 shadow"
                    : isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Package size={16} /> En almacén
              </button>
            </div>

            {locationType === "SHELF" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Pasillo</label>
                  <input type="text" placeholder="Ej. A" value={form.locationHall} onChange={(e) => setForm({ ...form, locationHall: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Estante</label>
                  <input type="text" placeholder="Ej. 1" value={form.locationShelf} onChange={(e) => setForm({ ...form, locationShelf: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fila</label>
                  <input type="text" placeholder="Ej. 2" value={form.locationRow} onChange={(e) => setForm({ ...form, locationRow: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Columna</label>
                  <input type="text" placeholder="Ej. 3" value={form.locationColumn} onChange={(e) => setForm({ ...form, locationColumn: e.target.value })} className={inputClass} />
                </div>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Detalle de bodega (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Bodega 2, caja 5"
                  value={form.storageLocation}
                  onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                  className={inputClass}
                />
                <p className={`text-xs mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Si lo dejas vacío, el libro queda marcado simplemente como "Bodega".
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all text-white ${
                  saving ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Save size={16} />
                {saving ? "Guardando..." : "Guardar ubicación"}
              </button>
              <button
                onClick={closeEditor}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de confirmación, breve y discreto */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            isDark ? "bg-slate-800 text-emerald-400 border border-slate-700" : "bg-white text-emerald-700 border border-emerald-100"
          }`}>
            <CheckCircle2 size={16} /> {toast}
          </div>
        </div>
      )}

      {showScanner && <BarcodeScanner onScan={handleScanCode} onClose={() => setShowScanner(false)} />}
    </DashboardLayout>
  );
}
