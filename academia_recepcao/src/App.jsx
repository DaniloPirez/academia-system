import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Catraca from "./pages/Catraca";
import Planos from "./pages/Planos";
import Usuarios from "./pages/Usuarios";
import TreinosRecepcao from "./pages/TreinosRecepcao";


function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/catraca" element={<Catraca />} />
            <Route path="/treinos" element={<TreinosRecepcao />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route
              path="/planos"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Planos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Usuarios />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
