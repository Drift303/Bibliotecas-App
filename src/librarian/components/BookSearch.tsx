interface BookSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  isDark: boolean;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  sortField: string;
  setSortField: (val: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (val: "asc" | "desc") => void;
}

export function BookSearch({ 
  search, onSearchChange, isDark,
  filterStatus, setFilterStatus,
  sortField, setSortField,
  sortOrder, setSortOrder
}: BookSearchProps) {
  return (
    <div className={`mb-6 p-4 rounded-xl border transition-colors ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar libro por título, autor o ISBN..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              isDark
                ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            }`}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border transition-colors ${isDark ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Prestado">Prestado</option>
            <option value="Extraviado">Extraviado</option>
            <option value="Eliminado">Eliminado</option>
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition-colors ${isDark ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
            >
              <option value="title">Título</option>
              <option value="author">Autor</option>
              <option value="id">ID</option>
            </select>
            
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-4 py-2 rounded-lg border transition-colors ${isDark ? "bg-slate-800 border-slate-600 text-white hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"}`}
              title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
