import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Academia Pro</div>

        <nav style={styles.nav}>
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/clientes" label="Clientes" />
          <NavItem to="/catraca" label="Catraca" />
          {user?.tipo === "admin" && <NavItem to="/planos" label="Planos" />}
        </nav>

        <div style={styles.userBox}>
          <div style={{ fontWeight: 700 }}>{user?.nome}</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>{user?.tipo}</div>

          <button onClick={logout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ fontWeight: 700 }}>Sistema Offline (Recepção)</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            {new Date().toLocaleString()}
          </div>
        </header>

        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        ...styles.navItem,
        ...(isActive ? styles.navItemActive : {}),
      })}
    >
      {label}
    </NavLink>
  );
}

const styles = {
  shell: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    minHeight: "100vh",
    background: "#0b0f17",
    color: "#e9eefc",
  },
  sidebar: {
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  brand: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 0.2,
    padding: "10px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
  },
  nav: { display: "flex", flexDirection: "column", gap: 8, marginTop: 6 },
  navItem: {
    textDecoration: "none",
    color: "#e9eefc",
    padding: "10px 12px",
    borderRadius: 10,
    opacity: 0.9,
  },
  navItemActive: {
    background: "rgba(255,255,255,0.10)",
    opacity: 1,
    fontWeight: 700,
  },
  userBox: {
    marginTop: "auto",
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logoutBtn: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "#e9eefc",
    cursor: "pointer",
  },
  main: { display: "flex", flexDirection: "column", minWidth: 0 },
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
  padding: 18,
  width: "100%",
  minWidth: 0,
  maxWidth: "1400px",   // aumente aqui
  margin: "0 auto",     // centraliza só quando passar do max
}
};