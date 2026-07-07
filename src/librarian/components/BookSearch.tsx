interface BookSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  isDark: boolean;
}

export function BookSearch({ search, onSearchChange, isDark }: BookSearchProps) {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Buscar libro por título, autor o ISBN..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
          isDark
            ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            : "bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        }`}
      />
    </div>
  );
}
