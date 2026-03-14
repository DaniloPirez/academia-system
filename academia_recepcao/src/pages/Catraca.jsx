import { useEffect, useState } from "react";
import api from "../api/client";
import "./Catraca.css";

export default function Catraca() {
  const [cpf, setCpf] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [ultimos, setUltimos] = useState([]);

    async function carregarUltimos() {
    try {
      const agora = new Date();
      const inicio = new Date(agora);
      inicio.setHours(0, 0, 0, 0);

      const fim = new Date(agora);
      fim.setHours(23, 59, 59, 999);

const res = await api.get("/catraca/acessos", {
  params: { inicio: inicio.toISOString(), fim: fim.toISOString() },
});

      setUltimos(res.data.slice(0, 10));
    } catch (e) {
      console.error("Erro ao carregar últimos acessos:", e?.response?.status, e?.response?.data || e);
      setUltimos([]); // opcional
    }
  }

  useEffect(() => {
    carregarUltimos();
  }, []);

  function limparCpf(v) {
    return (v || "").replace(/\D/g, "");
  }

  async function liberar() {
    setErro("");
    setResultado(null);

    const cpfLimpo = limparCpf(cpf);
    if (cpfLimpo.length !== 11) {
      setErro("CPF inválido (precisa ter 11 dígitos).");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/catraca/liberar", { cpf: cpfLimpo });
      setResultado(res.data);
      setCpf("");
      await carregarUltimos();
    } catch (e) {
      setErro(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : "Erro ao liberar catraca."
      );
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") liberar();
  }

  const status = (resultado?.status || "").toLowerCase();
  const ok = status === "liberado";

  return (
    <div className="catraca-container">
      <div className="catraca-header">
        <div>
          <div className="catraca-title">Catraca</div>
          <div className="catraca-subtitle">
            Digite o CPF e pressione Enter
          </div>
        </div>

        <button className="btn" onClick={liberar} disabled={loading}>
          {loading ? "Processando..." : "Liberar"}
        </button>
      </div>

      <div className="catraca-card">
        <label className="label">CPF</label>
        <input
          className="input"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="000.000.000-00"
          autoFocus
        />

        {erro && <div className="alert alert-error">{erro}</div>}

        {resultado && (
          <div className={`alert ${ok ? "alert-ok" : "alert-bad"}`}>
            <div className="alert-title">{ok ? "LIBERADO ✅" : "BLOQUEADO ❌"}</div>
            <div className="alert-text">
              {resultado.motivo ? resultado.motivo : "Acesso registrado."}
            </div>
            <div className="alert-small">
              {new Date(resultado.data_entrada).toLocaleString("pt-BR")}
            </div>
          </div>
        )}
      </div>

      <div className="catraca-card">
        <div className="card-title">Últimos acessos (hoje)</div>

        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ultimos.map((a) => (
              <tr key={a.cliente_nome}>
                <td>{new Date(a.data_entrada).toLocaleString("pt-BR")}</td>
                <td>{a.cliente_nome}</td>
                <td>
                  <span className={`pill ${(a.status || "").toLowerCase()}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}

            {ultimos.length === 0 && (
              <tr>
                <td colSpan={3} style={{ opacity: 0.8 }}>
                  Nenhum acesso registrado hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}