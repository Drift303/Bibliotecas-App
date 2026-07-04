import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: string;
  icon: React.ReactNode;
  iconBg?: string;
}

export function StatCard({ label, value, tone, icon, iconBg }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-900/80">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest">{label}</p>
          <h2 className={`text-5xl md:text-6xl font-black mt-2 tracking-tighter ${tone || "text-slate-900 dark:text-white"}`}>
            {value}
          </h2>
        </div>
        <div className={`p-4 rounded-2xl ${iconBg || "bg-slate-100/50 dark:bg-slate-800/50"} flex items-center justify-center shadow-inner`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
