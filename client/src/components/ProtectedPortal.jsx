import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedPortal({ role, roles, children }) {
  const location = useLocation();
  const session = JSON.parse(localStorage.getItem("angelshome_session") || "null");
  const token = localStorage.getItem("angelshome_token");
  if (!token || !session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  const allowedRoles = roles || (role ? [role] : null);
  if (allowedRoles && !allowedRoles.includes(session.role)) return <Navigate to={`/portal/${session.role}`} replace />;
  return children;
}
