import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 dark:text-white shadow flex items-center justify-between px-6 transition-colors">
      <h1 className="font-bold text-xl">
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