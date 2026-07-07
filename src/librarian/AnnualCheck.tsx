import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import api from "../api";
import { useBarcodeScannerGun } from "./hooks/useBarcodeScannerGun";
import { BarcodeScanner } from "../components/ui/BarcodeScanner";
import { CheckCircle2, XCircle, Search, Camera, ClipboardCheck, BookX, AlertTriangle, PlusCircle, Save, Download } from "lucide-react";
import { BookForm } from "./components/BookForm";
import * as XLSX from "xlsx";

interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  statusPhysical: string;
  observation?: string;
  validator?: string;
  status?: string;
  available?: boolean;
}

export default function AnnualCheck() {
  const { isDark } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [foundBookIds, setFoundBookIds] = useState<Set<string | number>>(() => {
    const saved = localStorage.getItem("audit_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      } catch (e) {}
    }
    return new Set();
  });
  
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanned, setLastScanned] = useState<Book | null>(null);

  const [auditForm, setAuditForm] = useState({
    statusPhysical: "GOOD",
    observation: "",
    validator: ""
  });
  const [savingAudit, setSavingAudit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States for adding a new book dynamically during audit
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");
  const [newBookFormData, setNewBookFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    status: "Disponible",
  });
  const [newBookError, setNewBookError] = useState("");
  const [savingNewBook, setSavingNewBook] = useState(false);

  // Filter mode
  const [filterMode, setFilterMode] = useState<"all" | "missing" | "found" | "loaned" | "dropped">("all");

  useEffect(() => {
    loadBooks();
  }, []);

  // Guardar progreso automáticamente cuando cambia
  useEffect(() => {
    const idsArray = Array.from(foundBookIds);
    localStorage.setItem("audit_progress", JSON.stringify(idsArray));
  }, [foundBookIds]);

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
        statusPhysical: b.statusPhysical || "GOOD",
        observation: b.observation || "",
        validator: b.validator || "",
        status: b.status || "AVAILABLE",
        available: b.available !== undefined ? b.available : true,
      }));
      setBooks(normalizedBooks);
    } catch (err) {
      console.error("Error cargando libros para auditoría:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCode = (code: string) => {
    const codeLower = code.toLowerCase().trim();
    const match = books.find(b => b.isbn.toLowerCase() === codeLower);
    
    if (match) {
      setFoundBookIds(prev => {
        const newSet = new Set(prev);
        newSet.add(match.id);
        return newSet;
      });
      setLastScanned(match);
      setAuditForm({
        statusPhysical: match.statusPhysical || "GOOD",
        observation: match.observation || "",
        validator: match.validator || ""
      });
      setSaveSuccess(false);
      setSearch("");
      setShowScanner(false);
      setUnknownBarcode(""); // Limpiar el mensaje de error si había uno
    } else {
      setShowScanner(false);
      setUnknownBarcode(code);
    }
  };

  const handleSaveNewBook = async () => {
    setSavingNewBook(true);
    setNewBookError("");
    try {
      const payload = {
        isbn: newBookFormData.isbn || "S/N",
        title: newBookFormData.title || "Desconocido",
        author: newBookFormData.author || "Desconocido",
        available: newBookFormData.status === "Disponible",
        status: newBookFormData.status === "Disponible" ? "AVAILABLE" : "LOANED",
        statusPhysical: "GOOD",
        statusLogical: "ACTIVE",
        locationHall: "General",
        locationShelf: "A1",
      };
      
      const res = await api.post("/books", payload);
      const createdBook = res.data.data;
      
      const newBookNormalized = {
        id: createdBook.id,
        isbn: createdBook.isbn || "S/N",
        title: createdBook.title,
        author: createdBook.author,
        statusPhysical: createdBook.statusPhysical || "GOOD",
        observation: createdBook.observation || "",
        validator: createdBook.validator || "",
      };

      setBooks(prev => [newBookNormalized, ...prev]);
      
      setFoundBookIds(prev => {
        const newSet = new Set(prev);
        newSet.add(createdBook.id);
        return newSet;
      });
      
      setLastScanned(newBookNormalized);
      setAuditForm({
        statusPhysical: newBookNormalized.statusPhysical,
        observation: "",
        validator: ""
      });

      setShowAddBookModal(false);
      setUnknownBarcode("");
      setSearch("");
    } catch (err) {
      console.error("Error creando nuevo libro", err);
      setNewBookError("Hubo un problema registrando el libro. Intenta nuevamente.");
    } finally {
      setSavingNewBook(false);
    }
  };

  const handleSaveAudit = async () => {
    if (!lastScanned) return;
    setSavingAudit(true);
    setSaveSuccess(false);
    try {
      await api.put(`/books/${lastScanned.id}`, {
        statusPhysical: auditForm.statusPhysical,
        observation: auditForm.observation,
        validator: auditForm.validator
      });
      
      // Update local state
      setBooks(prev => prev.map(b => 
        b.id === lastScanned.id 
          ? { ...b, statusPhysical: auditForm.statusPhysical, observation: auditForm.observation, validator: auditForm.validator }
          : b
      ));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando auditoría:", err);
      alert("No se pudo guardar la observación. Verifica tu conexión.");
    } finally {
      setSavingAudit(false);
    }
  };

  useBarcodeScannerGun((barcode) => {
    handleProcessCode(barcode);
  });

  const isLoaned = (b: Book) => b.status === "LOANED" || b.available === false;
  const isDropped = (b: Book) => b.statusPhysical === "LOST" || b.statusPhysical === "DISCARDED";

  const loanedBooksList = books.filter(b => isLoaned(b) && !isDropped(b));
  const droppedBooksList = books.filter(b => isDropped(b));
  const targetBooks = books.filter(b => !isLoaned(b) && !isDropped(b));

  const missingBooks = targetBooks.filter(b => !foundBookIds.has(b.id));
  const foundBooksList = targetBooks.filter(b => foundBookIds.has(b.id));

  const exportAuditToExcel = () => {
    // 1. Preparar datos
    const foundData = foundBooksList.map(b => ({
      ISBN: b.isbn, Título: b.title, Autor: b.author,
      "Estado Físico": b.statusPhysical, Observaciones: b.observation || "Ninguna", Validador: b.validator || "N/A"
    }));

    const missingData = missingBooks.map(b => ({
      ISBN: b.isbn, Título: b.title, Autor: b.author,
      "Estado Físico": b.statusPhysical, "Última Observación": b.observation || "Ninguna"
    }));

    const droppedData = droppedBooksList.map(b => ({
      ISBN: b.isbn, Título: b.title, Autor: b.author,
      "Causa de Baja": b.statusPhysical === "LOST" ? "Extraviado" : "Descartado",
      Observaciones: b.observation || "Ninguna"
    }));

    const loanedData = loanedBooksList.map(b => ({
      ISBN: b.isbn, Título: b.title, Autor: b.author,
      "Estado Físico": b.statusPhysical
    }));

    const wb = XLSX.utils.book_new();

    const wsFound = XLSX.utils.json_to_sheet(foundData.length ? foundData : [{ Mensaje: "No se encontraron libros aún" }]);
    const wsMissing = XLSX.utils.json_to_sheet(missingData.length ? missingData : [{ Mensaje: "No hay libros faltantes" }]);
    const wsDropped = XLSX.utils.json_to_sheet(droppedData.length ? droppedData : [{ Mensaje: "No hay bajas" }]);
    const wsLoaned = XLSX.utils.json_to_sheet(loanedData.length ? loanedData : [{ Mensaje: "No hay libros prestados" }]);

    XLSX.utils.book_append_sheet(wb, wsFound, "Encontrados");
    XLSX.utils.book_append_sheet(wb, wsMissing, "Faltantes");
    XLSX.utils.book_append_sheet(wb, wsDropped, "Bajas");
    XLSX.utils.book_append_sheet(wb, wsLoaned, "Prestados");

    const fecha = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Auditoria_Inventario_${fecha}.xlsx`);
  };

  let displayBooks = books;
  if (filterMode === "found") displayBooks = foundBooksList;
  if (filterMode === "missing") displayBooks = missingBooks;
  if (filterMode === "loaned") displayBooks = loanedBooksList;
  if (filterMode === "dropped") displayBooks = droppedBooksList;

  const progressPercentage = targetBooks.length === 0 ? 0 : Math.round((foundBooksList.length / targetBooks.length) * 100);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? "text-white" : "text-slate-800"}`}>
          <ClipboardCheck className={isDark ? "text-emerald-400" : "text-emerald-600"} size={32} />
          Auditoría Anual de Inventario
        </h1>
        <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Escanea los códigos de barras de los libros físicos para verificar su existencia en el sistema. Tu progreso se guarda automáticamente.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => {
            if(window.confirm("¿Estás seguro de reiniciar la auditoría? Todo el progreso actual se perderá.")) {
              setFoundBookIds(new Set());
              localStorage.removeItem("audit_progress");
            }
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Reiniciar Auditoría
        </button>

        <button
          onClick={() => {
            exportAuditToExcel();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
        >
          <Download size={18} /> Exportar Reporte a Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress & Stats */}
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-center ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Meta de Auditoría</p>
              <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                {foundBooksList.length} <span className="text-lg text-slate-500 font-normal">/ {targetBooks.length}</span>
              </p>
            </div>
            <div className={`text-xl font-bold ${progressPercentage === 100 ? "text-emerald-500" : isDark ? "text-blue-400" : "text-blue-600"}`}>
              {progressPercentage}%
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                progressPercentage === 100 ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex gap-4 mt-auto">
            <div className={`flex-1 p-3 rounded-xl border ${
              isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Encontrados</span>
              </div>
              <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{foundBooksList.length}</p>
            </div>
            <div className={`flex-1 p-3 rounded-xl border ${
              isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <XCircle size={16} className="text-red-500" />
                <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Faltantes</span>
              </div>
              <p className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{missingBooks.length}</p>
            </div>
          </div>
        </div>

        {/* Scanner Input */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}>
            Escanear o Ingresar ISBN
          </h2>
          
          <form onSubmit={handleManualSearch} className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} size={20} />
              <input
                type="text"
                placeholder="Escanea el código de barras o escribe el ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${
                  isDark
                    ? "bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 border border-slate-800 focus:border-blue-500"
                    : "bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 border border-slate-200 focus:border-blue-400"
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-500/20 whitespace-nowrap"
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className={`p-3 rounded-xl transition-all shadow-sm ${
                isDark
                  ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
              title="Usar cámara del dispositivo"
            >
              <Camera size={24} />
            </button>
          </form>

          {/* Last Scanned Feedback */}
          <div className={`p-4 rounded-xl border ${
            lastScanned
              ? isDark ? "bg-emerald-900/20 border-emerald-800/50" : "bg-emerald-50 border-emerald-200"
              : isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            {lastScanned ? (
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full mt-1 ${isDark ? "bg-emerald-900/50 text-emerald-400" : "bg-emerald-200 text-emerald-700"}`}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Libro verificado correctamente</p>
                  <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{lastScanned.title}</h3>
                  <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>ISBN: {lastScanned.isbn} • {lastScanned.author}</p>
                  
                  {/* Audit Form */}
                  <div className={`mt-2 pt-4 border-t flex flex-col gap-3 w-full ${isDark ? "border-emerald-800/30" : "border-emerald-200"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Estado Físico</label>
                        <select 
                          value={auditForm.statusPhysical} 
                          onChange={e => setAuditForm({...auditForm, statusPhysical: e.target.value})}
                          className={`w-full p-2 text-sm rounded-lg outline-none border transition-colors ${
                            isDark ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-slate-300 text-slate-800 focus:border-emerald-500"
                          }`}
                        >
                          <option value="GOOD">Buen Estado</option>
                          <option value="DAMAGED">Dañado / Regular</option>
                          <option value="LOST">Extraviado (No físico)</option>
                          <option value="DISCARDED">Descartado (Baja final)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Validador / Revisor</label>
                        <input 
                          type="text" 
                          placeholder="Nombre del revisor"
                          value={auditForm.validator} 
                          onChange={e => setAuditForm({...auditForm, validator: e.target.value})}
                          className={`w-full p-2 text-sm rounded-lg outline-none border transition-colors ${
                            isDark ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-slate-300 text-slate-800 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Observaciones (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Falta cubierta, páginas rayadas..."
                        value={auditForm.observation} 
                        onChange={e => setAuditForm({...auditForm, observation: e.target.value})}
                        className={`w-full p-2 text-sm rounded-lg outline-none border transition-colors ${
                          isDark ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-slate-300 text-slate-800 focus:border-emerald-500"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={handleSaveAudit}
                        disabled={savingAudit}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all text-white shadow-sm ${
                          savingAudit ? "bg-emerald-400 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                        }`}
                      >
                        {savingAudit ? "Guardando..." : "Guardar Observación"}
                      </button>
                      {saveSuccess && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
                          <CheckCircle2 size={16} /> Guardado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-slate-500 h-16">
                <BookX size={24} />
                <p>Esperando el primer escaneo...</p>
              </div>
            )}
            
            {/* Modal Not Found Action */}
            {unknownBarcode && !showAddBookModal && (
              <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${isDark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={isDark ? "text-amber-500" : "text-amber-600"} size={24} />
                  <div>
                    <h4 className={`font-semibold ${isDark ? "text-amber-400" : "text-amber-800"}`}>Código no encontrado</h4>
                    <p className={`text-sm ${isDark ? "text-amber-500/80" : "text-amber-700"}`}>El libro con código <strong>{unknownBarcode}</strong> no existe en el sistema.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewBookFormData(prev => ({ ...prev, isbn: unknownBarcode }));
                    setShowAddBookModal(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                    isDark ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                >
                  <PlusCircle size={18} /> Registrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book List Tabs */}
      <div className={`rounded-t-2xl border-b flex overflow-x-auto scrollbar-hide ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
        <button
          onClick={() => setFilterMode("all")}
          className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            filterMode === "all"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Todos ({books.length})
        </button>
        <button
          onClick={() => setFilterMode("missing")}
          className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            filterMode === "missing"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Faltantes ({missingBooks.length})
        </button>
        <button
          onClick={() => setFilterMode("found")}
          className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            filterMode === "found"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Encontrados ({foundBooksList.length})
        </button>
        <button
          onClick={() => setFilterMode("loaned")}
          className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            filterMode === "loaned"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Prestados ({loanedBooksList.length})
        </button>
        <button
          onClick={() => setFilterMode("dropped")}
          className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            filterMode === "dropped"
              ? "border-red-500 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Bajas ({droppedBooksList.length})
        </button>
      </div>

      {/* List */}
      <div className={`rounded-b-2xl border border-t-0 shadow-sm overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <table className="w-full">
          <thead className={`border-b ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
            <tr>
              <th className={`p-4 text-left font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Estado</th>
              <th className={`p-4 text-left font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>ISBN</th>
              <th className={`p-4 text-left font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Título</th>
              <th className={`p-4 text-left font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Autor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">Cargando libros...</td>
              </tr>
            ) : displayBooks.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">No hay libros en esta categoría.</td>
              </tr>
            ) : (
              displayBooks.map((book, idx) => {
                const isFound = foundBookIds.has(book.id);
                return (
                  <tr key={book.id} className={`border-b last:border-0 transition-colors ${
                    isDark 
                      ? idx % 2 === 0 ? "bg-slate-900" : "bg-slate-800/30"
                      : idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}>
                    <td className="p-4">
                      {isDropped(book) ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"}`}>
                          <XCircle size={14} /> {book.statusPhysical === "LOST" ? "Extraviado" : "Descartado"}
                        </span>
                      ) : isLoaned(book) ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
                          <BookX size={14} /> Prestado
                        </span>
                      ) : isFound ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                          <CheckCircle2 size={14} /> Encontrado
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                          <AlertTriangle size={14} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className={`p-4 font-mono text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{book.isbn}</td>
                    <td className={`p-4 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{book.title}</td>
                    <td className={`p-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{book.author}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleProcessCode}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddBookModal(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <BookForm
              editingBookId={null}
              formData={newBookFormData}
              setFormData={setNewBookFormData as any}
              actionError={newBookError}
              isDark={isDark}
              onSave={handleSaveNewBook}
              onCancel={() => {
                setShowAddBookModal(false);
                setUnknownBarcode("");
              }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
