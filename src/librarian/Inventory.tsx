import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { BarcodeScanner } from "../components/ui/BarcodeScanner";

// Importación de componentes refactorizados
import { InventoryHeader } from "./components/InventoryHeader";
import { BookTable } from "./components/BookTable";
import { BookForm } from "./components/BookForm";
import { BarcodeModal } from "./components/BarcodeModal";
import { BookSearch } from "./components/BookSearch";
import { BulkUploadConflictsModal } from "./components/BulkUploadConflictsModal";
import { ColumnMapperModal } from "./components/ColumnMapperModal";
import { Info } from "lucide-react";

// Custom Hook para toda la lógica de negocio y estados
import { useBookInventory } from "./hooks/useBookInventory";

export default function Inventory() {
  const { isDark } = useTheme();
  
  const {
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
  } = useBookInventory();

  return (
    <DashboardLayout>
      {/* Cabecera del inventario (Título, status, botones Excel/Scan/Nuevo) */}
      <InventoryHeader
        isDark={isDark}
        statusMessage={statusMessage}
        statusType={statusType}
        uploading={uploading}
        fileInputRef={fileInputRef}
        onFileUpload={handleFileUpload}
        onOpenScanner={() => setShowScanner(true)}
        onAddBook={handleAddBook}
        selectedPrintCount={selectedBooksToPrint.size}
        onPrintSelected={handlePrintSelected}
      />

      {/* Helper Banner para enseñar al usuario a usar las nuevas funciones */}
      <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border transition-colors ${
        isDark ? "bg-blue-900/20 border-blue-800/50" : "bg-blue-50 border-blue-200"
      }`}>
        <Info className={`mt-0.5 shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`} size={20} />
        <div className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          <p className="font-semibold mb-1">💡 Consejos Rápidos para el Bibliotecario:</p>
          <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
            <li><strong>Carga Masiva:</strong> Usa el botón superior para subir un archivo Excel. El sistema detectará libros repetidos automáticamente.</li>
            <li><strong>Impresión Múltiple:</strong> Selecciona las casillas (a la izquierda de cada libro) en la tabla inferior y haz clic en <strong>Imprimir</strong> arriba para generar planillas de códigos.</li>
          </ul>
        </div>
      </div>

      {/* Caja de Búsqueda de Libros */}
      <BookSearch
        search={search}
        onSearchChange={setSearch}
        isDark={isDark}
      />

      {/* Formulario para agregar / editar libro con escaneo de ISBN y generación de código de barras */}
      {showForm && (
        <BookForm
          editingBookId={editingBookId}
          formData={formData}
          setFormData={setFormData}
          actionError={actionError}
          isDark={isDark}
          onSave={handleSaveBook}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Listado principal de libros (Tabla) */}
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
        <BookTable
          books={filteredBooks}
          isDark={isDark}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintBarcode={handlePrintBarcode}
          selectedBooks={selectedBooksToPrint}
          onToggleSelect={handleToggleSelectBook}
          onSelectAll={handleSelectAllBooks}
        />
      )}

      {/* Modal General para Escanear Código QR/Barras y buscar en la lista */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Modal Mapeo de Columnas Excel */}
      <ColumnMapperModal
        isOpen={showColumnMapper}
        onClose={() => {
          setShowColumnMapper(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        headers={uploadHeaders}
        sampleRows={uploadRawData.slice(1, 4)}
        onConfirm={processMappedData}
      />

      {/* Modal Reutilizable para Previsualizar e Imprimir Código de Barras de un libro */}
      {showBarcodeModal && selectedBooksForBarcode && selectedBooksForBarcode.length > 0 && (
        <BarcodeModal
          isOpen={showBarcodeModal}
          onClose={() => {
            setShowBarcodeModal(false);
            setSelectedBooksForBarcode([]);
          }}
          books={selectedBooksForBarcode}
          isDark={isDark}
        />
      )}

      {showUploadModal && (
        <BulkUploadConflictsModal
          conflicts={uploadConflicts}
          pendingUploads={pendingUploads}
          isDark={isDark}
          onConfirm={confirmUpload}
          onCancel={() => setShowUploadModal(false)}
        />
      )}
    </DashboardLayout>
  );
}