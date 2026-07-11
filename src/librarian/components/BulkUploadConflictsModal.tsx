import { useState } from "react";
import { AlertCircle, CheckSquare, Square, X } from "lucide-react";

interface Conflict {
  isbn: string;
  title: string;
  author: string;
  duplicateReason: string;
}

interface BulkUploadConflictsModalProps {
  conflicts: Conflict[];
  pendingUploads: any[];
  isDark: boolean;
  onConfirm: (finalUploadList: any[]) => void;
  onCancel: () => void;
}

export function BulkUploadConflictsModal({
  conflicts,
  pendingUploads,
  isDark,
  onConfirm,
  onCancel,
}: BulkUploadConflictsModalProps) {
  const [selectedConflicts, setSelectedConflicts] = useState<Set<number>>(new Set());

  const toggleConflict = (index: number) => {
    const newSelected = new Set(selectedConflicts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedConflicts(newSelected);
  };

  const handleConfirm = () => {
    const conflictsToKeep = conflicts.filter((_, idx) => selectedConflicts.has(idx));
    const finalUploadList = [...pendingUploads, ...conflictsToKeep];
    onConfirm(finalUploadList);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${
          isDark ? "bg-slate-900 border border-slate-700" : "bg-white"
        }`}
      >
        <div className={`p-6 flex justify-between items-center border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600"}`}>
              <AlertCircle size={24} />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
              Posibles Duplicados Detectados
            </h2>
          </div>
          <button onClick={onCancel} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className={`mb-4 font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Se encontraron {conflicts.length} libro(s) que ya parecen existir en el inventario. <br />
            Selecciona cuáles deseas <strong>crear de todas formas</strong> (como nuevas copias). Los que no selecciones serán ignorados.
          </p>

          <div className="space-y-3">
            {conflicts.map((conflict, idx) => {
              const isSelected = selectedConflicts.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleConflict(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                    isSelected
                      ? isDark
                        ? "bg-blue-900/20 border-blue-700"
                        : "bg-blue-50 border-blue-200"
                      : isDark
                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className={`mt-0.5 ${isSelected ? "text-blue-500" : isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{conflict.title}</h3>
                    <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      ISBN: <span className="font-mono">{conflict.isbn}</span> • Autor: {conflict.author}
                    </p>
                    <p className={`text-xs mt-2 font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      Motivo: {conflict.duplicateReason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50"}`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              isDark
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Cancelar Carga
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all text-white ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-[#1E3A5F] hover:bg-[#2d5a8e]"
            }`}
          >
            Continuar e Importar ({pendingUploads.length + selectedConflicts.size})
          </button>
        </div>
      </div>
    </div>
  );
}
