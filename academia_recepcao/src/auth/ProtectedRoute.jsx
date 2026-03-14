import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.tipo)) {
    return <div>Acesso negado (permissão insuficiente).</div>;
  }

  return children;
}