import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggleButton() {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-md border border-transparent hover:border-slate-300/50 dark:hover:border-slate-700/50"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Alternar modo oscuro"
    >
      {isDark ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-slate-600" />
      )}
    </button>
  );
}
