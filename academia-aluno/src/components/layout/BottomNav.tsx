import { NavLink } from "react-router-dom";
import { LayoutDashboard, Fingerprint, CreditCard, Dumbbell, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/acessos", label: "Acessos", icon: Fingerprint },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav mobile-only">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `bottom-item ${isActive ? "active" : ""}`}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}