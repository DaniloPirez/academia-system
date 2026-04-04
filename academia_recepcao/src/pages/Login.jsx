import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const expiredMessage = sessionStorage.getItem("auth_expired_message");

    if (expiredMessage) {
      setErro(expiredMessage);
      sessionStorage.removeItem("auth_expired_message");
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await login(email, senha);
      nav("/");
    } catch {
      setErro("Login inválido. Verifique email/senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.brand}>Academia Pro</div>
        <div style={styles.subtitle}>Acesso Recepção / Admin</div>

        <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            placeholder="danilo@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />

          <label style={{ ...styles.label, marginTop: 12 }}>Senha</label>
          <input
            style={styles.input}
            placeholder="••••••"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && <div style={styles.error}>{erro}</div>}

          <button style={styles.btn} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "radial-gradient(900px 500px at 30% 20%, rgba(88,140,255,0.22), transparent), #0b0f17",
    color: "#e9eefc",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 22,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  brand: { fontSize: 22, fontWeight: 900 },
  subtitle: { opacity: 0.8, marginTop: 4 },
  label: { display: "block", fontSize: 12, opacity: 0.85, marginBottom: 6 },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e9eefc",
    outline: "none",
  },
  btn: {
    width: "100%",
    marginTop: 16,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(88,140,255,0.28)",
    color: "#e9eefc",
    cursor: "pointer",
    fontWeight: 800,
  },
  error: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    background: "rgba(220, 20, 60, 0.18)",
    border: "1px solid rgba(220, 20, 60, 0.28)",
    color: "#ffd6df",
    fontSize: 13,
  },
};
