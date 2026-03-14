import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import "./Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function carregar({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setRefreshing(silent);
    setErro("");

    try {
      const res = await api.get("/dashboard/resumo");
      setData(res.data);
    } catch (e) {
      setErro(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : "Falha ao carregar o dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const receitaFmt = useMemo(() => {
    const v = Number(data?.receita_mes ?? 0);
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }, [data]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-topbar">
        <div>
          <div className="dashboard-title">Dashboard</div>
          <div className="dashboard-subtitle">
            Visão geral da academia (offline)
          </div>
        </div>

        <button
          className="btn-refresh"
          onClick={() => carregar({ silent: true })}
          disabled={refreshing}
        >
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {loading && <div style={{ opacity: 0.8 }}>Carregando...</div>}

      {!loading && erro && (
        <div style={{ padding: 12, border: "1px solid rgba(220,20,60,0.3)", borderRadius: 12 }}>
          <b>Erro:</b> {erro}
        </div>
      )}

      {!loading && !erro && data && (
        <>
          <div className="dashboard-grid">
            <StatCard title="Clientes Ativos" value={data.clientes_ativos} />
            <StatCard title="Clientes Bloqueados" value={data.clientes_bloqueados} />
            <StatCard title="Planos Ativos" value={data.planos_ativos} />
            <StatCard title="Receita do Mês" value={receitaFmt} accent />
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-header">Últimos Acessos</div>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.ultimos_acessos || []).map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.data_entrada)}</td>
                    <td>{a.cliente_nome || a.cliente_id}</td>
                    <td>
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}

                {(data.ultimos_acessos || []).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ opacity: 0.8 }}>
                      Nenhum acesso registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, accent }) {
  return (
    <div className={`stat-card ${accent ? "stat-accent" : ""}`}>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">Atualizado via API</div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  let cls = "status-neutral";
  if (s === "liberado") cls = "status-ok";
  if (s === "bloqueado") cls = "status-bad";
  return <span className={`status-pill ${cls}`}>{status || "-"}</span>;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("pt-BR");
}