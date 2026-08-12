interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDark?: boolean;
}

export default function Pagination({ page, totalPages, onPageChange, isDark = false }: PaginationProps) {
  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isDark ? "border-slate-600 text-slate-200 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
        }`}
      >
        Anterior
      </button>
      <span className={isDark ? "text-slate-300" : "text-slate-600"}>
        Página {page} de {Math.max(1, totalPages)}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isDark ? "border-slate-600 text-slate-200 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
        }`}
      >
        Siguiente
      </button>
    </div>
  );
}
