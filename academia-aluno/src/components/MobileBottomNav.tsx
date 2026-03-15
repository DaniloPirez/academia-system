import { NavLink } from "react-router-dom";
import { House, Fingerprint, CreditCard, Dumbbell} from "lucide-react";
import { useClienteMe, getFotoUrl, getInitials } from "../hooks/useClienteMe";

const items = [
  { to: "/", label: "Início", icon: House },
  { to: "/acessos", label: "Acessos", icon: Fingerprint },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/treinos", label: "Treinos", icon: Dumbbell },
];

export default function MobileBottomNav() {
  const { data } = useClienteMe();
  const fotoUrl = getFotoUrl(data?.foto);

  return (
    <nav className="mobile-nav">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}

      <NavLink
        to="/perfil"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        {fotoUrl ? (
          <img src={fotoUrl} alt={data?.nome || "Aluno"} className="mobile-profile-image" />
        ) : (
          <div className="mobile-profile-fallback">
            {getInitials(data?.nome)}
          </div>
        )}
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}