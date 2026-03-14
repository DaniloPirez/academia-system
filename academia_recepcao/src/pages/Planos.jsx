import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import "./Planos.css";

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // busca
  const [filtro, setFiltro] = useState("");
  const [buscarId, setBuscarId] = useState("");
  const [resultadoId, setResultadoId] = useState(null);

  // modal
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState("create"); // create | edit
  const [editando, setEditando] = useState(null);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const res = await api.get("/planos/");
      setPlanos(res.data || []);
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const visiveis = useMemo(() => {
    const base = resultadoId ? [resultadoId] : planos;
    const f = filtro.trim().toLowerCase();
    if (!f) return base;
    return base.filter((p) =>
      `${p.id ?? ""} ${p.nome ?? ""} ${p.descricao ?? ""} ${p.valor ?? ""} ${
        p.duracao_meses ?? ""
      }`
        .toLowerCase()
        .includes(f)
    );
  }, [planos, filtro, resultadoId]);

  function abrirAdicionar() {
    setModo("create");
    setEditando(null);
    setOpen(true);
  }

  function abrirEditar(plano) {
    setModo("edit");
    setEditando(plano);
    setOpen(true);
  }

  async function salvar(form) {
    try {
      if (modo === "create") {
        await api.post("/planos/", form);
      } else {
        await api.put(`/planos/${editando.id}`, form);
      }

      setOpen(false);
      setResultadoId(null);
      setBuscarId("");
      await carregar();
    } catch (e) {
      alert(e?.response?.data?.detail || "Falha ao salvar plano.");
    }
  }

  async function deletar(plano) {
    const ok = window.confirm(
      `Deletar o plano “${plano.nome}”? Essa ação não pode ser desfeita.`
    );
    if (!ok) return;

    try {
      await api.delete(`/planos/${plano.id}`);
      setResultadoId(null);
      setBuscarId("");
      await carregar();
    } catch (e) {
      alert(e?.response?.data?.detail || "Falha ao deletar plano.");
    }
  }

  async function buscarPlanoPorId() {
    const id = buscarId.trim();
    if (!id) {
      setResultadoId(null);
      return;
    }
    try {
      const res = await api.get(`/planos/${id}`);
      setResultadoId(res.data);
      setErro("");
    } catch (e) {
      setResultadoId(null);
      alert(e?.response?.data?.detail || "Plano não encontrado.");
    }
  }

  function limparBuscaId() {
    setResultadoId(null);
    setBuscarId("");
  }

  return (
    <div className="planos-container">
      <div className="planos-top">
        <div>
          <div className="planos-title">Planos</div>
          <div className="planos-sub">Gerenciar planos</div>
        </div>

        <div className="planos-actions">
          <input
            className="planos-search"
            placeholder="Buscar por nome, descrição, valor..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button className="btn-primary" onClick={abrirAdicionar}>
            + Novo Plano
          </button>
        </div>
      </div>

      <div className="planos-findRow">
        <input
          className="planos-search"
          placeholder="Buscar por ID (UUID) e pressionar Enter..."
          value={buscarId}
          onChange={(e) => setBuscarId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") buscarPlanoPorId();
          }}
        />
        <button className="btn-ghost" onClick={buscarPlanoPorId}>
          Buscar por ID
        </button>
        {resultadoId && (
          <button className="btn-ghost" onClick={limparBuscaId}>
            Limpar
          </button>
        )}
      </div>

      {loading && <div className="muted">Carregando...</div>}
      {!loading && erro && <div className="errorBox">{erro}</div>}

      {!loading && !erro && (
        <div className="tableWrap">
          <table className="planos-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Duração</th>
                <th>Ativo</th>
                <th style={{ width: 280 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="name">{p.nome}</div>
                    <div className="mini">ID: {shortId(p.id)}</div>
                  </td>
                  <td>{p.descricao || "-"}</td>
                  <td>{formatMoney(p.valor)}</td>
                  <td>{p.duracao_meses} mês(es)</td>
                  <td>
                    <AtivoBadge ativo={p.ativo} />
                  </td>
                  <td>
                    <div className="rowActions">
                      <button className="btn-ghost" onClick={() => abrirEditar(p)}>
                        Editar
                      </button>
                      <button className="btn-ghost btn-warn" onClick={() => deletar(p)}>
                        Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Nenhum plano encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <PlanoModal
          modo={modo}
          plano={editando}
          onClose={() => setOpen(false)}
          onSave={salvar}
        />
      )}
    </div>
  );
}

function PlanoModal({ modo, plano, onClose, onSave }) {
  const [nome, setNome] = useState(plano?.nome ?? "");
  const [descricao, setDescricao] = useState(plano?.descricao ?? "");
  const [valor, setValor] = useState(plano?.valor ?? "");
  const [duracaoMeses, setDuracaoMeses] = useState(plano?.duracao_meses ?? 1);
  const [ativo, setAtivo] = useState(plano?.ativo ?? true);

  function submit(e) {
    e.preventDefault();

    const payload = {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      valor: Number(String(valor).replace(",", ".")),
      duracao_meses: Number(duracaoMeses),
    };

    // no create o backend não espera "ativo" (mas aceitará no update)
    if (modo === "edit") payload.ativo = Boolean(ativo);

    // validações simples
    if (!payload.nome) return alert("Informe o nome do plano.");
    if (!Number.isFinite(payload.valor) || payload.valor <= 0)
      return alert("Informe um valor válido (maior que 0).");
    if (!Number.isFinite(payload.duracao_meses) || payload.duracao_meses <= 0)
      return alert("Informe uma duração válida (em meses).");

    onSave(payload);
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">
            {modo === "create" ? "Novo Plano" : "Editar Plano"}
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>

        <form onSubmit={submit} className="form">
          <div className="grid2">
            <Field label="Nome">
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </Field>

            <Field label="Valor (R$)">
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 99.90"
              />
            </Field>

            <Field label="Duração (meses)">
              <input
                type="number"
                min={1}
                value={duracaoMeses}
                onChange={(e) => setDuracaoMeses(e.target.value)}
              />
            </Field>

            {modo === "edit" ? (
              <Field label="Ativo">
                <select
                  value={String(ativo)}
                  onChange={(e) => setAtivo(e.target.value === "true")}
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </Field>
            ) : (
              <div />
            )}
          </div>

          <Field label="Descrição">
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
            />
          </Field>

          <div className="formActions">
            <button className="btn-primary" type="submit">
              Salvar
            </button>
            <button className="btn-ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function AtivoBadge({ ativo }) {
  return (
    <span className={`status-badge ${ativo ? "badge-ok" : "badge-bad"}`}>
      {ativo ? "ativo" : "inativo"}
    </span>
  );
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function shortId(id) {
  const s = String(id || "");
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}
