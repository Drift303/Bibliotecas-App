import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import api from "../api";
import { FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface SummaryRow {
  departamento: string;
  prestamos: number;
  prestamoEnSala: number;
  total: number;
}

interface GenderRow {
  departamento: string;
  genero: string;
  total: number;
}

interface BookRow {
  titulo: string;
  veces: number;
}

interface ReportData {
  tenantType: "SCHOOL" | "PUBLIC_LIBRARY";
  month: string;
  summary: SummaryRow[];
  byGender: GenderRow[];
  topBooksHome: BookRow[];
  topBooksInLibrary: BookRow[];
  totalLoans: number;
}

// Mes actual en formato "YYYY-MM", usado como valor por defecto del selector.
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function Reports() {
  const { isDark } = useTheme();
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/reports/loans", { params: { month } });
      const data = res.data?.success ? res.data.data : res.data;
      setReport(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "No se pudo generar el reporte. Intenta de nuevo."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Arma el Excel a partir de la data agregada que ya trajo el backend.
  // Mismo patrón que ya usa AnnualCheck.tsx (XLSX.utils.json_to_sheet + book_append_sheet).
  const exportToExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(
      report.summary.map((r) => ({
        Departamento: r.departamento,
        Préstamos: r.prestamos,
        "Préstamo en sala": r.prestamoEnSala,
        Total: r.total,
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

    const wsGender = XLSX.utils.json_to_sheet(
      report.byGender.map((r) => ({
        Departamento: r.departamento,
        Género: r.genero,
        Total: r.total,
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsGender, "Por género");

    const wsBooksHome = XLSX.utils.json_to_sheet(
      report.topBooksHome.length
        ? report.topBooksHome.map((b, i) => ({ "N°": i + 1, Título: b.titulo, "N° de préstamos": b.veces }))
        : [{ Mensaje: "Sin préstamos a domicilio este mes" }]
    );
    XLSX.utils.book_append_sheet(wb, wsBooksHome, "Más prestados (domicilio)");

    const wsBooksSala = XLSX.utils.json_to_sheet(
      report.topBooksInLibrary.length
        ? report.topBooksInLibrary.map((b, i) => ({ "N°": i + 1, Título: b.titulo, "N° de préstamos": b.veces }))
        : [{ Mensaje: "Sin préstamos en sala este mes" }]
    );
    XLSX.utils.book_append_sheet(wb, wsBooksSala, "Más prestados (en sala)");

    XLSX.writeFile(wb, `Reporte_Prestamos_${report.month}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className={`text-2xl font-bold mb-1 flex items-center gap-2 ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
          <FileSpreadsheet className="w-6 h-6" /> Reporte de Préstamos
        </h1>
        <p className={`mb-6 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          Genera un reporte mensual de préstamos con desglose por departamento, género y tipo de préstamo.
        </p>

        <div className="flex items-end gap-4 mb-6">
          <div>
            <label className={`block mb-1 text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              Periodo
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-colors ${isDark ? "bg-slate-700 border-slate-600 text-white" : "border-[#E5E7EB] bg-white text-black"}`}
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className={`px-5 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50 ${isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-[#1E3A5F] hover:bg-[#3B82F6]"}`}
          >
            {loading ? "Generando..." : "Generar reporte"}
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg border ${isDark ? "bg-red-900 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}>
            {error}
          </div>
        )}

        {report && (
          <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-[#E5E7EB]"}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`font-semibold ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
                {report.totalLoans} préstamos encontrados en {report.month}
              </p>
              <button
                onClick={exportToExcel}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${isDark ? "bg-green-700 hover:bg-green-800" : "bg-green-600 hover:bg-green-700"}`}
              >
                <Download className="w-4 h-4" /> Exportar a Excel
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? "text-slate-400" : "text-gray-500"}>
                  <th className="text-left py-2">Departamento</th>
                  <th className="text-left py-2">Préstamos</th>
                  <th className="text-left py-2">Préstamo en sala</th>
                  <th className="text-left py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.map((row) => (
                  <tr key={row.departamento} className={isDark ? "text-slate-200 border-t border-slate-700" : "text-black border-t border-[#E5E7EB]"}>
                    <td className="py-2">{row.departamento}</td>
                    <td className="py-2">{row.prestamos}</td>
                    <td className="py-2">{row.prestamoEnSala}</td>
                    <td className="py-2">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
