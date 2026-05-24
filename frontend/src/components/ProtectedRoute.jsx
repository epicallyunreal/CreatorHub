import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../stores/authStore";

export default function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { isAuthenticated, actorType } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireSuperAdmin && actorType !== "user") return <Navigate to="/dashboard" replace />;
  if (!requireSuperAdmin && actorType === "user") return <Navigate to="/admin" replace />;
  return children;
}
