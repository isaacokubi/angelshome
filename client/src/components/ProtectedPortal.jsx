import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedPortal({ role, children }) {
  const location = useLocation(); const session = JSON.parse(localStorage.getItem("angelshome_session") || "null"); const token = localStorage.getItem("angelshome_token");
  if (!token || !session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && session.role !== role) return <Navigate to={`/portal/${session.role}`} replace />;
  return children;
}
