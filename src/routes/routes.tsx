import { BrowserRouter, Route, Routes } from "react-router-dom";

import Dashboard from "../librarian/Dashboard";
import Inventory from "../librarian/Inventory";
import QuickLoan from "../librarian/QuickLoan";
import Statistics from "../librarian/Statistics";
import Students from "../librarian/Students";
import Login from "../pages/Login";
import Register from "../pages/Register";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/quick-loan" element={<QuickLoan />} />
        <Route path="/students" element={<Students />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}