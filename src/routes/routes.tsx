import { BrowserRouter, Route, Routes } from "react-router-dom";

import Dashboard from "../librarian/Dashboard";
import Inventory from "../librarian/Inventory";
import QuickLoan from "../librarian/QuickLoan";
import Statistics from "../librarian/Statistics";
import Students from "../librarian/Students";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Catalog from "../student/Catalog";
import Billing from "../superadmin/Billing";
import Schools from "../superadmin/Schools";

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
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/billing" element={<Billing />} />
      </Routes>
    </BrowserRouter>
  );
}