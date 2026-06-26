import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
