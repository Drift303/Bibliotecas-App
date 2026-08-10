import { BrowserRouter, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../librarian/Dashboard";
import Inventory from "../librarian/Inventory";
import Loans from "../librarian/Loans";
import QuickLoan from "../librarian/QuickLoan";
import Students from "../librarian/Students";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Catalog from "../student/Catalog";
import Billing from "../superadmin/Billing";
import Schools from "../superadmin/Schools";
import AnnualCheck from "../librarian/AnnualCheck";
import Departments from "../librarian/Departments";
import MapLocation from "../librarian/MapLocation";
import Reports from "../librarian/Reports";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Todas las rutas operativas ahora requieren autenticación real */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/quick-loan" element={<ProtectedRoute><QuickLoan /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
        <Route path="/schools" element={<ProtectedRoute allowedRoles={["superadmin"]}><Schools /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute allowedRoles={["superadmin"]}><Billing /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
        <Route path="/annual-inventory" element={<ProtectedRoute><AnnualCheck /></ProtectedRoute>} />
        <Route path="/map-location" element={<ProtectedRoute><MapLocation /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} /> 
      </Routes>
    </BrowserRouter>
  );
}