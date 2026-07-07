import { Edit2, Trash2, Barcode } from "lucide-react";

interface Book {
  id: string | number;
  isbn: string;
  title: string;
  author: string;
  status: string;
}

interface BookTableProps {
  books: Book[];
  isDark: boolean;
  onEdit: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onPrintBarcode: (book: Book) => void;
  selectedBooks: Set<string | number>;
  onToggleSelect: (id: string | number) => void;
  onSelectAll: (ids: (string | number)[]) => void;
}

export function BookTable({ books, isDark, onEdit, onDelete, onPrintBarcode, selectedBooks, onToggleSelect, onSelectAll }: BookTableProps) {
  const allIds = books.map(b => b.id);
  const isAllSelected = books.length > 0 && books.every(b => selectedBooks.has(b.id));
  return (
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
            <th className="p-3 w-12 text-center">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={() => onSelectAll(allIds)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="p-3 text-left font-semibold">ISBN</th>
            <th className="p-3 text-left font-semibold">Título</th>
            <th className="p-3 text-left font-semibold">Autor</th>
            <th className="p-3 text-left font-semibold">Estado</th>
            <th className="p-3 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book, idx) => (
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
              <td className="p-3 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedBooks.has(book.id)}
                  onChange={() => onToggleSelect(book.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
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
                      : book.status === "Prestado"
                      ? isDark
                        ? "bg-amber-900/30 text-amber-300"
                        : "bg-amber-100 text-amber-700"
                      : book.status === "Eliminado"
                      ? isDark
                        ? "bg-red-900/30 text-red-300"
                        : "bg-red-100 text-red-700"
                      : isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {book.status}
                </span>
              </td>
              <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onPrintBarcode(book)}
                    className={`p-2 rounded-lg transition-all ${
                      isDark
                        ? "text-blue-400 hover:bg-blue-900/30"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Imprimir Código de Barras"
                  >
                    <Barcode size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(book.id)}
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
                    onClick={() => onDelete(book.id)}
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
      {books.length === 0 && (
        <div className={`p-8 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          No hay libros para mostrar.
        </div>
      )}
    </div>
  );
}
