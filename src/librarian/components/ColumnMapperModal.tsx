import React, { useState, useEffect } from "react";
import { X, Columns, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export interface ColumnMapping {
  isbn: number;
  title: number;
  author: number;
  status: number;
}

interface ColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  sampleRows: any[][];
  onConfirm: (mapping: ColumnMapping) => void;
}

const REQUIRED_FIELDS = ["isbn", "title"];

export function ColumnMapperModal({ isOpen, onClose, headers, sampleRows, onConfirm }: ColumnMapperModalProps) {
  const { isDark } = useTheme();
  
  // Mapping state holds the index of the selected header
  const [mapping, setMapping] = useState<ColumnMapping>({
    isbn: -1,
    title: -1,
    author: -1,
    status: -1
  });

  useEffect(() => {
    if (isOpen) {
      // Intentar adivinar automáticamente basados en el nombre
      const isbnIdx = headers.findIndex((h) => h?.toString().toLowerCase().includes("isbn") || h?.toString().toLowerCase().includes("código") || h?.toString().toLowerCase().includes("codigo"));
      const titleIdx = headers.findIndex((h) => h?.toString().toLowerCase().includes("título") || h?.toString().toLowerCase().includes("title") || h?.toString().toLowerCase().includes("nombre") || h?.toString().toLowerCase().includes("titulo"));
      const authorIdx = headers.findIndex((h) => h?.toString().toLowerCase().includes("autor") || h?.toString().toLowerCase().includes("author"));
      const statusIdx = headers.findIndex((h) => h?.toString().toLowerCase().includes("estado") || h?.toString().toLowerCase().includes("status"));

      setMapping({
        isbn: isbnIdx >= 0 ? isbnIdx : -1,
        title: titleIdx >= 0 ? titleIdx : -1,
        author: authorIdx >= 0 ? authorIdx : -1,
        status: statusIdx >= 0 ? statusIdx : -1
      });
    }
  }, [isOpen, headers]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(mapping);
  };

  // Ayudante para cambiar la asignación inversa (si elijo un campo para esta columna)
  const handleColumnAssign = (colIndex: number, field: keyof ColumnMapping | "") => {
    setMapping(prev => {
      const newMapping = { ...prev };
      
      // Si el campo ya estaba asignado a otra columna, lo liberamos
      if (field !== "") {
        if (newMapping[field as keyof ColumnMapping] === colIndex) {
          return prev; // No hay cambio
        }
        newMapping[field as keyof ColumnMapping] = colIndex;
      }
      
      // Si esta columna estaba asignada a otro campo, liberamos ese campo
      (Object.keys(newMapping) as Array<keyof ColumnMapping>).forEach(k => {
        if (newMapping[k] === colIndex && k !== field) {
          newMapping[k] = -1;
        }
      });
      
      return newMapping;
    });
  };

  // Determinar qué campo está asignado a una columna específica
  const getFieldForColumn = (colIndex: number): string => {
    const entry = Object.entries(mapping).find(([_, mappedColIdx]) => mappedColIdx === colIndex);
    return entry ? entry[0] : "";
  };

  const isReadyToSubmit = mapping.isbn !== -1 && mapping.title !== -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"
      }`}>
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${
          isDark ? "border-slate-800" : "border-slate-100"
        }`}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                <Columns size={20} />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                Asignar Columnas del Archivo
              </h2>
            </div>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Revisa la vista previa de tus datos y selecciona qué campo del sistema corresponde a cada columna de tu Excel.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-x-auto overflow-y-auto flex-1">
          <div className="min-w-max">
            <table className={`w-full border-collapse border rounded-xl overflow-hidden ${isDark ? "border-slate-700" : "border-slate-200"}`}>
              <thead>
                <tr className={isDark ? "bg-slate-800" : "bg-slate-50"}>
                  {headers.map((header, colIdx) => {
                    const currentField = getFieldForColumn(colIdx);
                    const isSelected = currentField !== "";
                    
                    return (
                      <th key={colIdx} className={`p-4 border text-left min-w-[200px] ${
                        isDark ? "border-slate-700" : "border-slate-200"
                      } ${isSelected ? (isDark ? "bg-blue-900/20" : "bg-blue-50") : ""}`}>
                        <div className="flex flex-col gap-2">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}>
                            Columna Excel: {header || `Col ${colIdx + 1}`}
                          </span>
                          
                          <select
                            value={currentField}
                            onChange={(e) => handleColumnAssign(colIdx, e.target.value as any)}
                            className={`w-full p-2 text-sm rounded-lg border outline-none font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? isDark ? "bg-blue-600 border-blue-500 text-white" : "bg-blue-600 border-blue-600 text-white"
                                : isDark ? "bg-slate-900 border-slate-600 text-slate-300" : "bg-white border-slate-300 text-slate-700"
                            }`}
                          >
                            <option value="">-- Ignorar Columna --</option>
                            <option value="isbn">Asignar a: ISBN / Código *</option>
                            <option value="title">Asignar a: Título *</option>
                            <option value="author">Asignar a: Autor</option>
                            <option value="status">Asignar a: Estado Físico</option>
                          </select>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={`border-b last:border-0 ${
                    isDark ? "border-slate-700 hover:bg-slate-800/50" : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    {headers.map((_, colIdx) => {
                      const isSelected = getFieldForColumn(colIdx) !== "";
                      return (
                        <td key={colIdx} className={`p-3 text-sm border-r last:border-r-0 ${
                          isDark ? "border-slate-700" : "border-slate-200"
                        } ${isSelected ? (isDark ? "text-blue-300 font-medium" : "text-blue-700 font-medium") : (isDark ? "text-slate-400" : "text-slate-500")}`}>
                          {row[colIdx] !== undefined && row[colIdx] !== null ? row[colIdx].toString() : <span className="opacity-50 italic">Vacío</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requisitos y Acciones */}
        <div className={`p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 ${
          isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm font-medium ${mapping.isbn !== -1 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}`}>
              <CheckCircle2 size={18} className={mapping.isbn !== -1 ? "opacity-100" : "opacity-30"} /> ISBN mapeado
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${mapping.title !== -1 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}`}>
              <CheckCircle2 size={18} className={mapping.title !== -1 ? "opacity-100" : "opacity-30"} /> Título mapeado
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isReadyToSubmit}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all text-white shadow-sm ${
                !isReadyToSubmit
                  ? "bg-blue-400 opacity-50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              Procesar Archivo <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
