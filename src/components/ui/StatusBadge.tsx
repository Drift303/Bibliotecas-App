import React from "react";

interface StatusBadgeProps {
  status: "Activo" | "Vencido" | "Devuelto";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Activo") {
    return (
      <span className="bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
        En préstamo
      </span>
    );
  }
  if (status === "Vencido") {
    return (
      <span className="bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
        Vencido
      </span>
    );
  }
  return (
    <span className="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
      Devuelto
    </span>
  );
}
