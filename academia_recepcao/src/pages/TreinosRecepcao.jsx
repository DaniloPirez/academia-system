import { useEffect, useMemo, useState } from "react";
import "./TreinosRecepcao.css";

const API_URL = "https://academia-backend-5m3g.onrender.com";

function novoExercicio() {
  return {
    nome_exercicio: "",
    video_url: "",
    dia_semana: "livre",
    ordem: 1,
    series: "",
    repeticoes: "",
    carga: "",
    descanso: "",
    observacoes: "",
  };
}

export default function TreinosRecepcao() {
  const [abaAtiva, setAbaAtiva] = useState("base");

  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [treinoBaseSelecionado, setTreinoBaseSelecionado] = useState("");

  const [treinosBase, setTreinosBase] = useState([]);
  const [treinosCliente, setTreinosCliente] = useState([]);

  const [expandidoId, setExpandidoId] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    tipo: "hipertrofia",
    caracteristica: "iniciante",
    descricao: "",
    exercicios: [novoExercicio()],
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [loadingAssociar, setLoadingAssociar] = useState(false);
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingCliente, setLoadingCliente] = useState(false);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("usuario_token") ||
    localStorage.getItem("admin_token");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  async function excluirTreinoVinculado(treinoId) {
  const confirmar = window.confirm(
    "Deseja excluir este treino vinculado ao cliente?"
  );
  if (!confirmar) return;

  try {
    setErro("");
    setSucesso("");

    const res = await fetch(`${API_URL}/treinos/${treinoId}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.detail || "Erro ao excluir treino vinculado");
    }

    setSucesso("Treino vinculado excluído com sucesso.");

    if (clienteSelecionado) {
      await carregarTreinosCliente(clienteSelecionado);
    }
  } catch (err) {
    setErro(err.message || "Erro ao excluir treino vinculado");
  }
}

  async function carregarClientes() {
    try {
      const res = await fetch(`${API_URL}/clientes`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Erro ao carregar clientes");
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar clientes");
      setClientes([]);
    }
  }

  async function carregarTreinosBase() {
    try {
      setLoadingBase(true);
      const res = await fetch(`${API_URL}/treinos/base`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Erro ao carregar treinos base");
      setTreinosBase(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar treinos base");
      setTreinosBase([]);
    } finally {
      setLoadingBase(false);
    }
  }

  async function carregarTreinosCliente(clienteId) {
    if (!clienteId) {
      setTreinosCliente([]);
      return;
    }

    try {
      setLoadingCliente(true);
      const res = await fetch(`${API_URL}/treinos?cliente_id=${clienteId}`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Erro ao carregar treinos do cliente");
      }
      setTreinosCliente(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar treinos do cliente");
      setTreinosCliente([]);
    } finally {
      setLoadingCliente(false);
    }
  }

  useEffect(() => {
    carregarClientes();
    carregarTreinosBase();
  }, []);

  useEffect(() => {
    if (abaAtiva === "cliente" && clienteSelecionado) {
      carregarTreinosCliente(clienteSelecionado);
    }
  }, [abaAtiva, clienteSelecionado]);

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarExercicio(index, campo, valor) {
    const novos = [...form.exercicios];
    novos[index][campo] = valor;
    setForm((prev) => ({ ...prev, exercicios: novos }));
  }

  function adicionarExercicio() {
    setForm((prev) => ({
      ...prev,
      exercicios: [...prev.exercicios, novoExercicio()],
    }));
  }

  function removerExercicio(index) {
    const novos = [...form.exercicios];
    novos.splice(index, 1);
    setForm((prev) => ({ ...prev, exercicios: novos }));
  }

  function limparFormulario() {
    setForm({
      nome: "",
      tipo: "hipertrofia",
      caracteristica: "iniciante",
      descricao: "",
      exercicios: [novoExercicio()],
    });
  }

  async function salvarTreinoBase(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.nome.trim()) {
      setErro("Informe o nome do treino.");
      return;
    }

    if (form.exercicios.some((ex) => !ex.nome_exercicio.trim())) {
      setErro("Todos os exercícios precisam ter nome.");
      return;
    }

    const payload = {
      nome: form.nome,
      tipo: form.tipo,
      caracteristica: form.caracteristica,
      descricao: form.descricao || null,
      exercicios: form.exercicios.map((ex, index) => ({
        ...ex,
        ordem: Number(ex.ordem || index + 1),
        series: ex.series ? Number(ex.series) : null,
        repeticoes: ex.repeticoes || null,
        carga: ex.carga || null,
        descanso: ex.descanso || null,
        observacoes: ex.observacoes || null,
        video_url: ex.video_url || null,
        dia_semana: ex.dia_semana || "livre",
      })),
    };

    try {
      setLoadingSalvar(true);

      const res = await fetch(`${API_URL}/treinos/base`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Erro ao salvar treino base");
      }

      setSucesso("Treino base criado com sucesso.");
      limparFormulario();
      await carregarTreinosBase();
    } catch (err) {
      setErro(err.message || "Erro ao salvar treino base");
    } finally {
      setLoadingSalvar(false);
    }
  }

  async function excluirTreinoBase(treinoId) {
    const confirmar = window.confirm("Deseja excluir este treino base?");
    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      const res = await fetch(`${API_URL}/treinos/${treinoId}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || "Erro ao excluir treino base");
      }

      setSucesso("Treino base excluído com sucesso.");
      await carregarTreinosBase();
    } catch (err) {
      setErro(err.message || "Erro ao excluir treino base");
    }
  }

  async function associarTreinoAoCliente() {
    setErro("");
    setSucesso("");

    if (!clienteSelecionado) {
      setErro("Selecione um cliente.");
      return;
    }

    if (!treinoBaseSelecionado) {
      setErro("Selecione um treino base.");
      return;
    }

    try {
      setLoadingAssociar(true);

      const res = await fetch(
        `${API_URL}/treinos/base/${treinoBaseSelecionado}/associar`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ cliente_id: clienteSelecionado }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Erro ao associar treino");
      }

      setSucesso("Treino associado ao cliente com sucesso.");
      await carregarTreinosCliente(clienteSelecionado);
    } catch (err) {
      setErro(err.message || "Erro ao associar treino");
    } finally {
      setLoadingAssociar(false);
    }
  }

  function nomeClienteSelecionado() {
    const cliente = clientes.find((c) => c.id === clienteSelecionado);
    return cliente?.nome || "";
  }

  return (
    <div className="treinos-page">
      <div className="treinos-header">
        <div>
          <h1>Treinos</h1>
          <p>Gerencie treinos base e vincule treinos aos clientes.</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${abaAtiva === "base" ? "active" : ""}`}
          onClick={() => setAbaAtiva("base")}
        >
          Treinos Base
        </button>
        <button
          className={`tab-btn ${abaAtiva === "cliente" ? "active" : ""}`}
          onClick={() => setAbaAtiva("cliente")}
        >
          Vincular ao Cliente
        </button>
      </div>

      {erro && <div className="alert error">{erro}</div>}
      {sucesso && <div className="alert success">{sucesso}</div>}

      {abaAtiva === "base" && (
        <div className="grid-base">
          <section className="panel">
            <div className="panel-header">
              <h2>Criar treino base</h2>
              <p>Monte a biblioteca de treinos reutilizáveis.</p>
            </div>

            <form className="form-grid" onSubmit={salvarTreinoBase}>
              <div className="field field-span-2">
                <label>Nome do treino</label>
                <input
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                />
              </div>

              <div className="field">
                <label>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => atualizarCampo("tipo", e.target.value)}
                >
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="forca_maxima">Força máxima</option>
                  <option value="resistencia">Resistência</option>
                  <option value="potencia">Potência</option>
                  <option value="emagrecimento">Emagrecimento</option>
                </select>
              </div>

              <div className="field">
                <label>Perfil</label>
                <select
                  value={form.caracteristica}
                  onChange={(e) =>
                    atualizarCampo("caracteristica", e.target.value)
                  }
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="veterano">Veterano</option>
                </select>
              </div>

              <div className="field field-span-2">
                <label>Descrição</label>
                <textarea
                  rows="3"
                  value={form.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                  placeholder="Objetivo, observações gerais, foco do treino..."
                />
              </div>

              <div className="field field-span-2">
                <div className="section-title-row">
                  <h3>Exercícios</h3>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={adicionarExercicio}
                  >
                    Adicionar exercício
                  </button>
                </div>

                <div className="exercise-list">
                  {form.exercicios.map((ex, i) => (
                    <div key={i} className="exercise-card">
                      <div className="exercise-grid">
                        <div className="field field-span-2">
                          <label>Nome do exercício</label>
                          <input
                            value={ex.nome_exercicio}
                            onChange={(e) =>
                              atualizarExercicio(
                                i,
                                "nome_exercicio",
                                e.target.value
                              )
                            }
                            placeholder="Ex: Supino reto"
                          />
                        </div>

                        <div className="field">
                          <label>Séries</label>
                          <input
                            value={ex.series}
                            onChange={(e) =>
                              atualizarExercicio(i, "series", e.target.value)
                            }
                            placeholder="4"
                          />
                        </div>

                        <div className="field">
                          <label>Repetições</label>
                          <input
                            value={ex.repeticoes}
                            onChange={(e) =>
                              atualizarExercicio(
                                i,
                                "repeticoes",
                                e.target.value
                              )
                            }
                            placeholder="12"
                          />
                        </div>

                        <div className="field">
                          <label>Carga</label>
                          <input
                            value={ex.carga}
                            onChange={(e) =>
                              atualizarExercicio(i, "carga", e.target.value)
                            }
                            placeholder="20kg"
                          />
                        </div>

                        <div className="field">
                          <label>Descanso</label>
                          <input
                            value={ex.descanso}
                            onChange={(e) =>
                              atualizarExercicio(i, "descanso", e.target.value)
                            }
                            placeholder="60s"
                          />
                        </div>

                        <div className="field field-span-2">
                          <label>Vídeo</label>
                          <input
                            value={ex.video_url}
                            onChange={(e) =>
                              atualizarExercicio(i, "video_url", e.target.value)
                            }
                            placeholder="Link do vídeo"
                          />
                        </div>

                        <div className="field field-span-2">
                          <label>Observações</label>
                          <input
                            value={ex.observacoes}
                            onChange={(e) =>
                              atualizarExercicio(
                                i,
                                "observacoes",
                                e.target.value
                              )
                            }
                            placeholder="Amplitude, postura, execução..."
                          />
                        </div>
                      </div>

                      <div className="exercise-actions">
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => removerExercicio(i)}
                          disabled={form.exercicios.length === 1}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions field-span-2">
                <button type="submit" className="btn primary" disabled={loadingSalvar}>
                  {loadingSalvar ? "Salvando..." : "Salvar treino base"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Treinos base cadastrados</h2>
              <p>Visualize, expanda exercícios e exclua quando necessário.</p>
            </div>

            {loadingBase ? (
              <p className="empty">Carregando treinos base...</p>
            ) : treinosBase.length === 0 ? (
              <p className="empty">Nenhum treino base cadastrado.</p>
            ) : (
              <div className="list-cards">
                {treinosBase.map((treino) => (
                  <div className="data-card" key={treino.id}>
                    <div className="data-card-header">
                      <div>
                        <h3>{treino.nome}</h3>
                        <p>
                          {treino.tipo} • {treino.caracteristica}
                        </p>
                      </div>

                      <div className="data-card-actions">
                        <button
                          className="btn secondary"
                          onClick={() =>
                            setExpandidoId(expandidoId === treino.id ? null : treino.id)
                          }
                        >
                          {expandidoId === treino.id ? "Ocultar" : "Ver exercícios"}
                        </button>

                        <button
                          className="btn danger"
                          onClick={() => excluirTreinoBase(treino.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {treino.descricao && (
                      <p className="card-description">{treino.descricao}</p>
                    )}

                    {expandidoId === treino.id && (
                      <div className="exercise-preview">
                        {(treino.exercicios || []).length === 0 ? (
                          <p className="empty small">Nenhum exercício cadastrado.</p>
                        ) : (
                          treino.exercicios.map((ex) => (
                            <div key={ex.id} className="exercise-preview-item">
                              <strong>{ex.nome_exercicio}</strong>
                              <span>
                                {ex.series || "-"} séries • {ex.repeticoes || "-"} reps
                                • {ex.carga || "sem carga"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {abaAtiva === "cliente" && (
        <div className="grid-cliente">
          <section className="panel">
            <div className="panel-header">
              <h2>Vincular treino ao cliente</h2>
              <p>Associe uma cópia de um treino base ao cliente.</p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Cliente</label>
                <select
                  value={clienteSelecionado}
                  onChange={(e) => setClienteSelecionado(e.target.value)}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Treino base</label>
                <select
                  value={treinoBaseSelecionado}
                  onChange={(e) => setTreinoBaseSelecionado(e.target.value)}
                >
                  <option value="">Selecione um treino base</option>
                  {treinosBase.map((treino) => (
                    <option key={treino.id} value={treino.id}>
                      {treino.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions field-span-2">
                <button
                  className="btn primary"
                  onClick={associarTreinoAoCliente}
                  disabled={loadingAssociar}
                >
                  {loadingAssociar ? "Associando..." : "Associar treino"}
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Treinos vinculados</h2>
              <p>
                {clienteSelecionado
                  ? `Treinos do cliente ${nomeClienteSelecionado()}`
                  : "Selecione um cliente para visualizar os treinos vinculados."}
              </p>
            </div>

            {loadingCliente ? (
              <p className="empty">Carregando treinos do cliente...</p>
            ) : !clienteSelecionado ? (
              <p className="empty">Nenhum cliente selecionado.</p>
            ) : treinosCliente.length === 0 ? (
              <p className="empty">Nenhum treino vinculado para este cliente.</p>
            ) : (
              <div className="list-cards">
                {treinosCliente.map((treino) => (
                  <div className="data-card" key={treino.id}>
                    <div className="data-card-header">
                      <div>
                        <h3>{treino.nome}</h3>
                        <p>
                          {treino.tipo} • {treino.caracteristica}
                        </p>
                      </div>

                      <button
                        className="btn secondary"
                        onClick={() =>
                          setExpandidoId(expandidoId === treino.id ? null : treino.id)
                        }
                      >
                        {expandidoId === treino.id ? "Ocultar" : "Ver exercícios"}
                      </button>
                    </div>

                    {treino.descricao && (
                      <p className="card-description">{treino.descricao}</p>
                    )}

                    {expandidoId === treino.id && (
                      <div className="exercise-preview">
                        {(treino.exercicios || []).length === 0 ? (
                          <p className="empty small">Nenhum exercício cadastrado.</p>
                        ) : (
                          treino.exercicios.map((ex) => (
                            <div key={ex.id} className="exercise-preview-item">
                              <strong>{ex.nome_exercicio}</strong>
                              <span>
                                {ex.series || "-"} séries • {ex.repeticoes || "-"} reps
                                • {ex.carga || "sem carga"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div className="replace-actions">
                      <div className="replace-hint">
                        Para trocar o treino do cliente, associe outro treino base.
                      </div>

                      <button
                        type="button"
                        className="delete-linked-text"
                        onClick={() => excluirTreinoVinculado(treino.id)}
                      >
                        Excluir treino vinculado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}