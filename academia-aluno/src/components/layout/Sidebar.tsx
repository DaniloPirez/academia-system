import { NavLink } from "react-router-dom";
import { LayoutDashboard, Fingerprint, CreditCard, Dumbbell, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/acessos", label: "Acessos", icon: Fingerprint },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function Sidebar() {
  return (
    <aside className="sidebar desktop-only">
      <div className="brand">
        <div className="brand-badge">A</div>
        <div>
          <strong>Área do Aluno</strong>
          <span>Academia</span>
        </div>
      </div>

      <nav className="nav-list">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}