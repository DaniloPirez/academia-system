import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", senha);

      const { data } = await api.post("/clientes/login", form, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("cliente_token", data.access_token);

      if (data.refresh_token) {
        localStorage.setItem("cliente_refresh_token", data.refresh_token);
      }

      navigate("/");
    } catch (error: any) {
      setErro(error?.response?.data?.detail || "Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-badge">Área do Aluno</div>
        <h1>Bem-vindo</h1>
        <p>Entre com seu e-mail e senha.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro ? <div className="error-box">{erro}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}