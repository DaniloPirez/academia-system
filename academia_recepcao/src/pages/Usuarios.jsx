import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import "./Usuarios.css";

const TIPOS = [
  { value: "admin", label: "admin" },
  { value: "recepcao", label: "recepcao" },
  { value: "instrutor", label: "instrutor" },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // form create
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("recepcao");
  const [salvando, setSalvando] = useState(false);

  // filtro opcional
  const [filtro, setFiltro] = useState("");

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const res = await api.get("/usuarios/");
      setUsuarios(res.data || []);
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return usuarios;
    return usuarios.filter((u) =>
      `${u.nome ?? ""} ${u.email ?? ""} ${u.tipo ?? ""}`.toLowerCase().includes(f)
    );
  }, [usuarios, filtro]);

  async function criar(e) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      alert("Preencha nome, email e senha.");
      return;
    }

    setSalvando(true);
    try {
      await api.post("/usuarios/", { nome, email, senha, tipo });
      setNome("");
      setEmail("");
      setSenha("");
      setTipo("recepcao");
      await carregar();
      alert("Usuário criado com sucesso!");
    } catch (e2) {
      alert(e2?.response?.data?.detail || "Falha ao criar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-top">
        <div>
          <div className="usuarios-title">Usuários</div>
          <div className="usuarios-sub">Cadastro e lista (admin)</div>
        </div>

        <input
          className="usuarios-search"
          placeholder="Buscar por nome, email ou tipo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="usuarios-grid">
        <div className="usuarios-card">
          <div className="card-title">Criar usuário</div>

          <form className="form" onSubmit={criar}>
            <label className="field">
              <span className="label">Nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>

            <label className="field">
              <span className="label">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <label className="field">
              <span className="label">Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="label">Tipo</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="formActions">
              <button className="btn-primary" type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>

        <div className="usuarios-card">
          <div className="card-title">Lista de usuários</div>

          {loading && <div className="muted">Carregando...</div>}
          {!loading && erro && <div className="errorBox">{erro}</div>}

          {!loading && !erro && (
            <div className="tableWrap">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`pill ${String(u.tipo || "").toLowerCase()}`}>
                          {u.tipo}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={3} className="muted">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}