import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const normalizedRequiredRole = requiredRole ? String(requiredRole).toLowerCase() : null;
  if (normalizedRequiredRole && user?.role !== normalizedRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;