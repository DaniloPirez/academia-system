import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AcessosPage from "./pages/AcessosPage";
import PagamentosPage from "./pages/PagamentosPage";
import PerfilPage from "./pages/PerfilPage";
import TreinosPage from "./pages/TreinosPage";
import AppLayout from "./components/AppLayout";
import { isAuthenticated } from "./lib/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="acessos" element={<AcessosPage />} />
        <Route path="pagamentos" element={<PagamentosPage />} />
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="treinos" element={<TreinosPage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} replace />} />
    </Routes>
  );
}
