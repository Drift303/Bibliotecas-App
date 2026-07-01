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
    <div className={`flex ${isDark ? "dark" : ""}`}>
      <Sidebar />

      <div className="flex-1 min-h-screen bg-slate-100 dark:bg-slate-950 dark:text-white transition-colors">
        <Navbar />

        <main className="p-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}