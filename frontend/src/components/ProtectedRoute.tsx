import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Readonly<ProtectedRouteProps>) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
