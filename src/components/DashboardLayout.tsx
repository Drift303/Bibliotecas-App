import React from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { isDark } = useTheme();

  return (
    <div className={`flex relative min-h-screen ${isDark ? "dark" : ""}`}>
      {/* Elementos decorativos de fondo para que el cristal destaque */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-950 dark:to-slate-900 pointer-events-none" />
      
      {/* Decorative blurs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none z-0" />

      <div className="relative z-10 flex w-full">
        <Sidebar />

        <div className="flex-1 min-h-screen text-slate-900 dark:text-slate-50 transition-colors flex flex-col relative z-10">
          <Navbar />

          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full relative z-10">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}