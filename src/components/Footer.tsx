import { useTheme } from "../context/ThemeContext";

export default function Footer() {
  const { isDark } = useTheme();

  return (
    <footer className={`border-t h-12 flex items-center justify-center transition-colors ${
      isDark ? "bg-slate-900 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"
    }`}>
      Biblioteca © 2026
    </footer>
  );
}