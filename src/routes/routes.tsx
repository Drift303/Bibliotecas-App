import { BrowserRouter, Route, Routes } from "react-router-dom";

<<<<<<< HEAD
=======
import ProtectedRoute from "../components/ProtectedRoute";
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
import Dashboard from "../librarian/Dashboard";
import Inventory from "../librarian/Inventory";
import Loans from "../librarian/Loans";
import QuickLoan from "../librarian/QuickLoan";
import Students from "../librarian/Students";
import Login from "../pages/Login";
import Catalog from "../student/Catalog";
import Billing from "../superadmin/Billing";
import Schools from "../superadmin/Schools";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
<<<<<<< HEAD

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/quick-loan" element={<QuickLoan />} />
        <Route path="/students" element={<Students />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/loans" element={<Loans />} />
      </Routes>
    </BrowserRouter>
  );
}
=======
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/quick-loan" element={<ProtectedRoute><QuickLoan /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
        <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
>>>>>>> 060aff8 (feat: conexion con el backend, mejorar la seguridad con ProtectedRoute y creacion del boton de cerrar sesion)
