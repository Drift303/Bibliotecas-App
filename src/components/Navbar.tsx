import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <header className="h-16 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl text-slate-900 dark:text-slate-50 border-b border-white/50 dark:border-slate-800/50 flex items-center justify-between px-6 transition-all duration-300 shadow-sm shadow-slate-200/20 dark:shadow-black/20 relative z-20">
      <h1 className="font-semibold text-lg tracking-tight">
        Sistema Bibliotecario
      </h1>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label="Alternar modo oscuro"
        >
          {isDark ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-slate-600" />
          )}
        </button>
        <div>
          Bibliotecario
        </div>
      </div>
    </header>
  );
}