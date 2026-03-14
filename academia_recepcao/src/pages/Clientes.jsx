import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import "./Clientes.css";

const STATUS = ["ativo", "inativo", "bloqueado"];

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // modal cliente
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState("create"); // create | edit
  const [editando, setEditando] = useState(null);

  // modal planos
  const [openPlanos, setOpenPlanos] = useState(false);
  const [clientePlano, setClientePlano] = useState(null);
  const [msgPlano, setMsgPlano] = useState(null);

  // pagamentos
  const [openPagamentos, setOpenPagamentos] = useState(false);
  const [clientePagamentos, setClientePagamentos] = useState(null);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const res = await api.get("/clientes/");
      setClientes(res.data || []);
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return clientes;
    return clientes.filter((c) =>
      `${c.nome ?? ""} ${c.cpf ?? ""} ${c.email ?? ""}`
        .toLowerCase()
        .includes(f)
    );
  }, [clientes, filtro]);

  function abrirAdicionar() {
    setModo("create");
    setEditando(null);
    setOpen(true);
  }

  function abrirEditar(cliente) {
    setModo("edit");
    setEditando(cliente);
    setOpen(true);
  }

  function abrirPagamentos(cliente) {
    setClientePagamentos(cliente);
    setOpenPagamentos(true);
  }

  function abrirPlanos(cliente) {
    setMsgPlano(null);
    setClientePlano(cliente);
    setOpenPlanos(true);
  }

  async function salvar(form) {
    try {
      if (modo === "create") {
        await api.post("/clientes/", form);
      } else {
        await api.put(`/clientes/${editando.id}`, form);
      }
      setOpen(false);
      await carregar();
    } catch (e) {
      alert(e?.response?.data?.detail || "Falha ao salvar cliente.");
    }
  }

  async function vincularPlano(planoId) {
    if (!clientePlano?.id) return;

    try {
      const res = await api.put(
        `/clientes/${clientePlano.id}/vincular-plano/${planoId}`
      );
      setMsgPlano(res.data); // {mensagem, cliente, plano, vence_em}
      await carregar();
    } catch (e) {
      alert(e?.response?.data?.detail || "Falha ao vincular plano.");
    }
  }

  async function alternarBloqueio(cliente) {
    const novoStatus = cliente.status === "bloqueado" ? "ativo" : "bloqueado";
    try {
      // Opção A (recomendada): endpoint dedicado
      await api.patch(`/clientes/${cliente.id}/status`, { status: novoStatus });

      // Se você NÃO tiver esse endpoint, comente a linha acima e use:
      // await api.patch(`/clientes/${cliente.id}`, { status: novoStatus });

      await carregar();
    } catch (e) {
      alert(e?.response?.data?.detail || "Falha ao atualizar status.");
    }
  }

  return (
    <div className="clientes-container">
      <div className="clientes-top">
        <div>
          <div className="clientes-title">Clientes</div>
          <div className="clientes-sub">Busca, edição e bloqueio</div>
        </div>

        <div className="clientes-actions">
          <input
            className="clientes-search"
            placeholder="Buscar por nome, CPF ou email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button className="btn-primary" onClick={abrirAdicionar}>
            + Adicionar Cliente
          </button>
        </div>
      </div>

      {loading && <div className="muted">Carregando...</div>}
      {!loading && erro && <div className="errorBox">{erro}</div>}

      {!loading && !erro && (
        <div className="tableWrap">
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Email</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th style={{ width: 300 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="name">{c.nome}</div>
                    <div className="mini">{c.telefone || ""}</div>
                  </td>
                  <td>{formatCPF(c.cpf)}</td>
                  <td>{c.email}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{c.data_vencimento ? formatDate(c.data_vencimento) : "-"}</td>
                  <td>
                    <div className="rowActions">
                      <button className="btn-ghost" onClick={() => abrirEditar(c)}>
                        Editar
                      </button>

                      <button className="btn-ghost" onClick={() => abrirPlanos(c)}>
                        Planos
                      </button>

                      <button className="btn-ghost" onClick={() => abrirPagamentos(c)}>
                        Pagamentos
                      </button>

                      <button
                        className={`btn-ghost ${
                          c.status === "bloqueado" ? "btn-ok" : "btn-warn"
                        }`}
                        onClick={() => alternarBloqueio(c)}
                      >
                        {c.status === "bloqueado" ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <ClienteModal
          modo={modo}
          cliente={editando}
          onClose={() => setOpen(false)}
          onSave={salvar}
        />
      )}

      {openPlanos && (
        <VincularPlanoModal
          cliente={clientePlano}
          resultado={msgPlano}
          onClose={() => {
            setOpenPlanos(false);
            setClientePlano(null);
            setMsgPlano(null);
          }}
          onVincular={vincularPlano}
        />
      )}

      {openPagamentos && (
        <PagamentosModal
          cliente={clientePagamentos}
          onClose={() => {
            setOpenPagamentos(false);
            setClientePagamentos(null);
          }}
        />
      )}
    </div>
  );
}

function PagamentosModal({ cliente, onClose }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [gerando, setGerando] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const res = await api.get(`/pagamentos/cliente/${cliente.id}`);
      setPagamentos(res.data || []);
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao carregar pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cliente?.id) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id]);

  async function gerarCobranca() {
    if (!cliente?.id) return;
    setGerando(true);
    try {
      await api.post(`/pagamentos/cliente/${cliente.id}/gerar-cobranca`);
      await carregar();
      alert("Cobrança gerada com sucesso!");
    } catch (e) {
      alert(e?.response?.data?.detail || "Falha ao gerar cobrança.");
    } finally {
      setGerando(false);
    }
  }

  const pendentes = pagamentos.filter((p) => (p.status || "").toLowerCase() === "pendente");
  const aprovados = pagamentos.filter((p) => (p.status || "").toLowerCase() === "aprovado");

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal modal-lg" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Pagamentos</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {cliente?.nome} • Vencimento: {cliente?.data_vencimento ? formatDate(cliente.data_vencimento) : "-"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={gerarCobranca} disabled={gerando}>
              {gerando ? "Gerando..." : "Gerar cobrança"}
            </button>
            <button className="btn-ghost" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        {loading && <div className="muted">Carregando...</div>}
        {!loading && erro && <div className="errorBox">{erro}</div>}

        {!loading && !erro && (
          <div className="pagamentos-grid">
            <div className="pag-card">
              <div className="pag-title">Próximas cobranças</div>
              {pendentes.length === 0 && <div className="muted">Nenhuma cobrança pendente.</div>}
              {pendentes.map((p) => (
                <div className="pag-item" key={p.id}>
                  <div>
                    <div className="pag-main">{p.plano_nome || "Mensalidade"}</div>
                    <div className="pag-sub">
                      Vencimento: {p.vencimento ? formatDate(p.vencimento) : "-"} • Comp: {p.competencia}
                    </div>
                  </div>
                  <div className="pag-right">
                    <div className="pag-valor">R$ {Number(p.valor).toFixed(2)}</div>
                    <span className="pill pendente">pendente</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pag-card">
              <div className="pag-title">Itens pagos</div>
              {aprovados.length === 0 && <div className="muted">Nenhum pagamento aprovado.</div>}
              {aprovados.map((p) => (
                <div className="pag-item" key={p.id}>
                  <div>
                    <div className="pag-main">{p.plano_nome || "Mensalidade"}</div>
                    <div className="pag-sub">
                      Pago em: {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString("pt-BR") : "-"} • Comp: {p.competencia}
                    </div>
                  </div>
                  <div className="pag-right">
                    <div className="pag-valor">R$ {Number(p.valor).toFixed(2)}</div>
                    <span className="pill aprovado">aprovado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClienteModal({ modo, cliente, onClose, onSave }) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [cpf, setCpf] = useState(cliente?.cpf ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [endereco, setEndereco] = useState(cliente?.endereco ?? "");
  const [status, setStatus] = useState(cliente?.status ?? "ativo");
  const [dataVenc, setDataVenc] = useState(
    cliente?.data_vencimento ? toInputDate(cliente.data_vencimento) : ""
  );
  const [senha, setSenha] = useState("");

  function submit(e) {
    e.preventDefault();

    const payload = {
      nome,
      cpf: onlyDigits(cpf),
      email,
      telefone,
      endereco,
      status,
      data_vencimento: dataVenc ? new Date(dataVenc).toISOString() : null,
    };

    // no create normalmente senha é obrigatória
    if (modo === "create") payload.senha = senha;
    // no edit só envia senha se preencher
    if (modo === "edit" && senha.trim()) payload.senha = senha;

    onSave(payload);
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">
            {modo === "create" ? "Adicionar Cliente" : "Editar Cliente"}
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

            <Field label="CPF">
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </Field>

            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>

            <Field label="Telefone">
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </Field>

            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data de vencimento">
              <input
                type="date"
                value={dataVenc}
                onChange={(e) => setDataVenc(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Endereço">
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </Field>

          <Field
            label={modo === "create" ? "Senha (obrigatória)" : "Senha (opcional)"}
          >
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={modo === "edit" ? "Deixe em branco para manter" : ""}
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

function VincularPlanoModal({ cliente, resultado, onClose, onVincular }) {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [selecionado, setSelecionado] = useState(cliente?.plano_id || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function carregarPlanos() {
      setLoading(true);
      setErro("");
      try {
        const res = await api.get("/planos/");
        const lista = (res.data || []).filter((p) => p?.ativo === true);
        setPlanos(lista);

        const atual = cliente?.plano_id;
        if (atual && lista.some((p) => p.id === atual)) {
          setSelecionado(atual);
        } else if (lista.length) {
          setSelecionado(lista[0].id);
        }
      } catch (e) {
        setErro(e?.response?.data?.detail || "Erro ao carregar planos.");
      } finally {
        setLoading(false);
      }
    }

    carregarPlanos();
  }, [cliente?.plano_id]);

  const planoAtualObj = planos.find((p) => p.id === cliente?.plano_id);
  const planoSelecionadoObj = planos.find((p) => p.id === selecionado);

  async function confirmar() {
    if (!selecionado) return alert("Selecione um plano.");
    setSubmitting(true);
    try {
      await onVincular(selecionado);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">Vincular plano</div>
          <button className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="form">
          <div className="muted" style={{ marginBottom: 8 }}>
            Cliente: <b>{cliente?.nome}</b>
          </div>

          <div className="muted" style={{ marginBottom: 12 }}>
            Plano atual: <b>{planoAtualObj ? planoAtualObj.nome : "-"}</b> • Vencimento:{" "}
            <b>{cliente?.data_vencimento ? formatDate(cliente.data_vencimento) : "-"}</b>
          </div>

          {loading && <div className="muted">Carregando planos...</div>}
          {!loading && erro && <div className="errorBox">{erro}</div>}

          {!loading && !erro && (
            <>
              <label className="field">
                <span className="label">Selecionar plano</span>
                <select
                  value={selecionado}
                  onChange={(e) => setSelecionado(e.target.value)}
                >
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} • {p.duracao_meses} mês(es) • {formatMoney(p.valor)}
                    </option>
                  ))}
                </select>
              </label>

              {planoSelecionadoObj?.descricao && (
                <div className="muted" style={{ marginTop: -6, marginBottom: 6 }}>
                  {planoSelecionadoObj.descricao}
                </div>
              )}

              <div className="formActions">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={confirmar}
                  disabled={!selecionado || planos.length === 0 || submitting}
                >
                  {submitting ? "Vinculando..." : "Vincular"}
                </button>
                <button className="btn-ghost" type="button" onClick={onClose}>
                  Cancelar
                </button>
              </div>

              {resultado && (
                <div className="successBox" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900 }}>{resultado.mensagem}</div>
                  <div>Cliente: {resultado.cliente}</div>
                  <div>Plano: {resultado.plano}</div>
                  <div>
                    Vence em:{" "}
                    {resultado.vence_em
                      ? new Date(resultado.vence_em).toLocaleString("pt-BR")
                      : "-"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  let cls = "badge-neutral";
  if (s === "ativo") cls = "badge-ok";
  if (s === "bloqueado") cls = "badge-bad";
  if (s === "inativo") cls = "badge-neutral";
  return <span className={`status-badge ${cls}`}>{status || "-"}</span>;
}

function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v ?? "-");
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  const d = new Date(value);
  return d.toLocaleDateString("pt-BR");
}

function toInputDate(value) {
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function onlyDigits(v) {
  return String(v || "").replace(/\D/g, "");
}

function formatCPF(cpf) {
  const c = onlyDigits(cpf);
  if (c.length !== 11) return cpf || "-";
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}
