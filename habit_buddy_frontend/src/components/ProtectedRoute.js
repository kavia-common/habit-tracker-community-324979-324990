import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** PUBLIC_INTERFACE */
export default function ProtectedRoute() {
  /** Protects nested routes; redirects to /login when unauthenticated. */
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
