import { useNavigate } from "react-router-dom";
import api from "../api";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (err) {
      console.warn("No se pudo cerrar la sesion en el servidor", err);
    } finally {
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("tenantId");
      navigate("/", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`bg-[#C53030] text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:bg-red-700 hover:shadow-md ${className}`}
    >
      Cerrar sesion
    </button>
  );
}
