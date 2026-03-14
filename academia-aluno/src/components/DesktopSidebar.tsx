import { NavLink, useNavigate } from "react-router-dom";
import { House, Fingerprint, CreditCard, Dumbbell, User, LogOut } from "lucide-react";
import { api } from "../lib/api";
import { useClienteMe, getFotoUrl, getInitials } from "../hooks/useClienteMe";

const items = [
  { to: "/", label: "Dashboard", icon: House },
  { to: "/acessos", label: "Acessos", icon: Fingerprint },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function DesktopSidebar() {
  const navigate = useNavigate();
  const { data } = useClienteMe();

  async function handleLogout() {
    try {
      await api.post("/clientes/me/logout");
    } catch {
    } finally {
      localStorage.removeItem("cliente_token");
      localStorage.removeItem("cliente_refresh_token");
      navigate("/login");
    }
  }

  const fotoUrl = getFotoUrl(data?.foto);

  return (
    <aside className="desktop-sidebar">
      <div className="desktop-profile-card">
        {fotoUrl ? (
          <img src={fotoUrl} alt={data?.nome || "Aluno"} className="desktop-profile-image" />
        ) : (
          <div className="desktop-profile-fallback">
            {getInitials(data?.nome)}
          </div>
        )}

        <div className="desktop-profile-text">
          <strong>{data?.nome || "Aluno"}</strong>
          <span>{data?.email || "Área do aluno"}</span>
        </div>
      </div>

      <div className="desktop-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `desktop-nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <button className="desktop-logout" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Sair</span>
      </button>
    </aside>
  );
}