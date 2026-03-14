import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import AcessosPage from "../pages/AcessosPage";
import PagamentosPage from "../pages/PagamentosPage";
import PerfilPage from "../pages/PerfilPage";
import TreinosPage from "../pages/TreinosPage";
import { isAuthenticated } from "../lib/auth";


function PrivateRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <AppShell />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "acessos", element: <AcessosPage /> },
      { path: "pagamentos", element: <PagamentosPage /> },
      { path: "treinos", element: <TreinosPage /> },
      { path: "perfil", element: <PerfilPage /> },
    ],
  },
]);