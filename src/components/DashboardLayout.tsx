import React from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-slate-100">
        <Navbar />

        <main className="p-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}