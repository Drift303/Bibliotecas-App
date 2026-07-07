import { AlertCircle, CheckCircle, FileSpreadsheet, Camera, Plus } from "lucide-react";
import React from "react";

interface InventoryHeaderProps {
  isDark: boolean;
  statusMessage: string;
  statusType: "ok" | "error" | "info";
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenScanner: () => void;
  onAddBook: () => void;
}

export function InventoryHeader({
  isDark,
  statusMessage,
  statusType,
  uploading,
  fileInputRef,
  onFileUpload,
  onOpenScanner,
  onAddBook,
}: InventoryHeaderProps) {
  return (
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

      <div className="flex flex-wrap gap-3">
        {/* Input oculto para subir archivos */}
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          ref={fileInputRef}
          onChange={onFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            uploading ? "opacity-70 cursor-wait" : ""
          } ${
            isDark
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {uploading ? <FileSpreadsheet className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
          {uploading ? "Procesando..." : "Carga Masiva"}
        </button>

        <button
          onClick={onOpenScanner}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            isDark
              ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
          }`}
        >
          <Camera size={18} />
          Escanear QR
        </button>

        <button
          onClick={onAddBook}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            isDark
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-[#1E3A5F] text-white hover:bg-[#2d5a8e]"
          }`}
        >
          <Plus size={20} /> Nuevo Libro
        </button>
      </div>
    </div>
  );
}
