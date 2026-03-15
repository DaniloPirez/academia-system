import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = "https://academia-backend-5m3g.onrender.com";

type Exercicio = {
  id: string;
  nome_exercicio: string;
  video_url?: string | null;
  dia_semana?: string | null;
  ordem?: number | null;
  series?: number | null;
  repeticoes?: string | null;
  carga?: string | null;
  descanso?: string | null;
  observacoes?: string | null;
};

type Execucao = {
  id: string;
  treino_exercicio_id: string;
  nome_exercicio?: string | null;
  series_planejadas?: number | null;
  series_concluidas?: number | null;
  repeticoes_planejadas?: string | null;
  repeticoes_realizadas?: string | null;
  carga_planejada?: string | null;
  carga_realizada?: string | null;
  concluido?: boolean;
  observacoes?: string | null;
};

type Treino = {
  id: string;
  cliente_id?: string | null;
  instrutor_id: string;
  instrutor_nome?: string | null;
  nome: string;
  tipo: string;
  caracteristica: string;
  descricao?: string | null;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
  exercicios: Exercicio[];
};

type Historico = {
  id: string;
  treino_id: string;
  cliente_id?: string;
  dia_semana: string;
  iniciado_em?: string | null;
  finalizado_em?: string | null;
  duracao_segundos?: number | null;
  status: string;
  observacoes?: string | null;
};

function obterDiaAtual() {
  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  return dias[new Date().getDay()];
}

function obterDiaAtualHistorico() {
  const dias = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];
  return dias[new Date().getDay()];
}

function formatarDiaExibicao(dia?: string | null) {
  const mapa: Record<string, string> = {
    domingo: "Domingo",
    segunda: "Segunda-feira",
    terca: "Terça-feira",
    quarta: "Quarta-feira",
    quinta: "Quinta-feira",
    sexta: "Sexta-feira",
    sabado: "Sábado",
  };

  return (dia && mapa[dia]) || dia || "-";
}

function formatarTempo(segundos: number) {
  const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
  const s = String(segundos % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function capitalizar(texto?: string | null) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function converterYoutubeParaEmbed(url?: string | null) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null);
  const [execucoesAtuais, setExecucoesAtuais] = useState<Execucao[]>([]);
  const [salvandoExecucaoId, setSalvandoExecucaoId] = useState<string | null>(null);

  const [treinoEmExecucao, setTreinoEmExecucao] = useState<Treino | null>(null);
  const [historicoExecucaoId, setHistoricoExecucaoId] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [videoAberto, setVideoAberto] = useState("");

  const [modalFinalizacaoAberto, setModalFinalizacaoAberto] = useState(false);
  const [observacaoFinalizacao, setObservacaoFinalizacao] = useState("");

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token =
    localStorage.getItem("cliente_token") ||
    localStorage.getItem("access_token");

  const headers = useMemo(() => {
    const base: Record<string, string> = { "Content-Type": "application/json" };
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }, [token]);

  function selecionarTreino(treino: Treino) {
    setTreinoSelecionado(treino);
  }

  async function buscarTreinos() {
    try {
      const res = await fetch(`${API_URL}/treinos/me/lista`, {
        headers,
      });

      if (res.status === 401) {
        throw new Error("unauthorized");
      }

      if (!res.ok) {
        throw new Error("Falha ao buscar treinos");
      }

      const data: Treino[] = await res.json();
      setTreinos(data);

      if (!treinoSelecionado && data.length > 0) {
        selecionarTreino(data[0]);
      }

      setErro("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";

      if (message === "unauthorized") {
        setErro("Sessão expirada ou token inválido. Faça login novamente.");
        setTreinos([]);
        return;
      }

      setErro("Não foi possível carregar os treinos.");
      setTreinos([]);
    }
  }

  async function buscarHistorico() {
    try {
      const res = await fetch(`${API_URL}/treinos/me/historico`, {
        headers,
      });

      if (res.status === 401) {
        throw new Error("unauthorized");
      }

      if (!res.ok) {
        throw new Error("Falha ao buscar histórico");
      }

      const data: Historico[] = await res.json();
      setHistorico(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";

      if (message === "unauthorized") {
        setHistorico([]);
        return;
      }

      setHistorico([]);
    }
  }

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      await Promise.all([buscarTreinos(), buscarHistorico()]);
      setCarregando(false);
    }

    carregar();
  }, []);

  useEffect(() => {
    if (treinoEmExecucao) {
      intervaloRef.current = setInterval(() => {
        setSegundos((prev) => prev + 1);
      }, 1000);
    } else if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [treinoEmExecucao]);

  async function iniciarTreino(treino: Treino) {
    setTreinoEmExecucao(treino);
    setSegundos(0);

    const diaAtual = obterDiaAtualHistorico();

    try {
      const res = await fetch(`${API_URL}/treinos/${treino.id}/iniciar`, {
        method: "POST",
        headers,
        body: JSON.stringify({ dia_semana: diaAtual }),
      });

      if (!res.ok) {
        throw new Error("Falha ao iniciar treino");
      }

      const data: { id: string; execucoes?: Execucao[] } = await res.json();
      setHistoricoExecucaoId(data.id);
      setExecucoesAtuais(data.execucoes || []);
    } catch {
      alert("Não foi possível iniciar o treino.");
      setTreinoEmExecucao(null);
      setHistoricoExecucaoId(null);
      setExecucoesAtuais([]);
      setSegundos(0);
    }
  }

  async function finalizarTreino() {
    if (!treinoEmExecucao) return;

    const treinoAtual = treinoEmExecucao;
    const historicoId = historicoExecucaoId;

    try {
      if (historicoId) {
        await fetch(
          `${API_URL}/treinos/${treinoAtual.id}/finalizar/${historicoId}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              observacoes: observacaoFinalizacao || null,
            }),
          }
        );
      }

      const novoHistorico: Historico = {
        id: historicoId || `mock-${Date.now()}`,
        treino_id: treinoAtual.id,
        dia_semana: obterDiaAtualHistorico(),
        iniciado_em: new Date(Date.now() - segundos * 1000).toISOString(),
        finalizado_em: new Date().toISOString(),
        duracao_segundos: segundos,
        status: "finalizado",
        observacoes: observacaoFinalizacao || null,
      };

      setHistorico((prev) => [novoHistorico, ...prev]);
      setTreinoEmExecucao(null);
      setHistoricoExecucaoId(null);
      setSegundos(0);
      setExecucoesAtuais([]);
      setObservacaoFinalizacao("");
      setModalFinalizacaoAberto(false);
    } catch {
      alert("Não foi possível finalizar o treino agora.");
    }
  }

  function atualizarExecucaoLocal(
    execucaoId: string,
    campo: keyof Execucao,
    valor: string | number | boolean | null
  ) {
    setExecucoesAtuais((prev) =>
      prev.map((item) =>
        item.id === execucaoId ? { ...item, [campo]: valor } : item
      )
    );
  }

  async function salvarExecucao(execucao: Execucao) {
    try {
      setSalvandoExecucaoId(execucao.id);

      const res = await fetch(`${API_URL}/treinos/execucoes/${execucao.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          series_concluidas: Number(execucao.series_concluidas || 0),
          repeticoes_realizadas: execucao.repeticoes_realizadas || "",
          carga_realizada: execucao.carga_realizada || "",
          concluido: !!execucao.concluido,
          observacoes: execucao.observacoes || "",
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar execução");
      }

      const data: Execucao = await res.json();

      setExecucoesAtuais((prev) =>
        prev.map((item) => (item.id === data.id ? data : item))
      );
    } catch {
      alert("Não foi possível salvar os dados do exercício.");
    } finally {
      setSalvandoExecucaoId(null);
    }
  }

  const exerciciosComExecucao = useMemo(() => {
    if (!treinoSelecionado?.exercicios) return [];

    return [...treinoSelecionado.exercicios]
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map((exercicio) => {
        const execucao = execucoesAtuais.find(
          (item) => item.treino_exercicio_id === exercicio.id
        );

        return {
          ...exercicio,
          execucao,
        };
      });
  }, [treinoSelecionado, execucoesAtuais]);

  const totalExercicios = execucoesAtuais.length;
  const totalConcluidos = execucoesAtuais.filter((item) => item.concluido).length;
  const progresso =
    totalExercicios > 0
      ? Math.round((totalConcluidos / totalExercicios) * 100)
      : 0;

  function obterNomeTreino(treinoId: string) {
    const treino = treinos.find((t) => t.id === treinoId);
    return treino ? treino.nome : "Treino";
  }

  if (carregando) {
    return (
      <div className="pagina-treinos">
        <h2>Treinos</h2>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="pagina-treinos">
      <div className="topo-treinos">
        <div>
          <h2>Treinos</h2>
          <p className="subtitulo">
            Hoje é <strong>{obterDiaAtual()}</strong>
          </p>
        </div>
      </div>

      {erro && <div className="alerta-info">{erro}</div>}

      <div className="layout-treinos">
        <div className="coluna-esquerda">
          <h3>Meus treinos</h3>

          <div className="lista-cards-treinos">
            {treinos.length === 0 ? (
              <div className="card-treino vazio">Nenhum treino disponível.</div>
            ) : (
              treinos.map((treino) => (
                <div
                  key={treino.id}
                  className={`card-treino ${
                    treinoSelecionado?.id === treino.id ? "selecionado" : ""
                  }`}
                >
                  <div className="card-treino-header">
                    <div>
                      <h4>{treino.nome}</h4>
                      <p>
                        {capitalizar(treino.tipo)} •{" "}
                        {capitalizar(treino.caracteristica)}
                      </p>
                    </div>
                    <span className="badge-status">
                      {treino.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <p className="descricao-treino">
                    {treino.descricao || "Sem descrição"}
                  </p>

                  <div className="acoes-card acoes-card-coluna">
                    <div className="info-personal">
                      <span className="label-personal">Personal responsável</span>
                      <strong>{treino.instrutor_nome || "Não informado"}</strong>
                    </div>

                    <button
                      className="btn-primario"
                      onClick={() => selecionarTreino(treino)}
                      disabled={!!treinoEmExecucao}
                    >
                      Selecionar treino
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="coluna-direita">
          {treinoSelecionado ? (
            <>
              <div className="painel-detalhes">
                <div className="painel-header">
                  <div>
                    <h3>{treinoSelecionado.nome}</h3>
                    <p>
                      {capitalizar(treinoSelecionado.tipo)} •{" "}
                      {capitalizar(treinoSelecionado.caracteristica)}
                    </p>
                  </div>

                  {!treinoEmExecucao ? (
                    <button
                      className="btn-primario"
                      onClick={() => iniciarTreino(treinoSelecionado)}
                    >
                      Iniciar treino
                    </button>
                  ) : (
                    <button
                      className="btn-finalizar"
                      onClick={() => setModalFinalizacaoAberto(true)}
                    >
                      Finalizar treino
                    </button>
                  )}
                </div>

                {treinoEmExecucao &&
                  treinoEmExecucao.id === treinoSelecionado.id && (
                    <div className="painel-execucao">
                      <div className="cronometro-box">
                        <span>Cronômetro</span>
                        <strong>{formatarTempo(segundos)}</strong>
                      </div>

                      <div className="progresso-box">
                        <span>
                          Exercícios concluídos: {totalConcluidos}/
                          {totalExercicios}
                        </span>
                        <div className="barra-progresso">
                          <div
                            className="barra-progresso-fill"
                            style={{ width: `${progresso}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                <div className="blocos-dias">
                  {exerciciosComExecucao.length === 0 ? (
                    <p>Nenhum exercício cadastrado para este treino.</p>
                  ) : (
                    <div className="bloco-dia">
                      <h4>Exercícios do treino</h4>

                      <div className="lista-exercicios">
                        {exerciciosComExecucao.map((exercicio) => {
                          const execucao = exercicio.execucao;

                          const estaExecutandoMesmoTreino =
                            treinoEmExecucao &&
                            treinoEmExecucao.id === treinoSelecionado.id;

                          const progressoExercicio =
                            execucao?.series_planejadas &&
                            execucao.series_planejadas > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    ((execucao.series_concluidas || 0) /
                                      execucao.series_planejadas) *
                                      100
                                  )
                                )
                              : 0;

                          return (
                            <div className="item-exercicio" key={exercicio.id}>
                              <div className="item-exercicio-topo">
                                <div>
                                  <strong>
                                    {exercicio.ordem}. {exercicio.nome_exercicio}
                                  </strong>
                                  <p>
                                    {exercicio.series || "-"} séries •{" "}
                                    {exercicio.repeticoes || "-"} reps •{" "}
                                    {exercicio.carga || "sem carga"} • descanso{" "}
                                    {exercicio.descanso || "-"}
                                  </p>
                                </div>

                                {execucao?.concluido && (
                                  <span className="badge-concluido">
                                    Concluído
                                  </span>
                                )}
                              </div>

                              {exercicio.observacoes && (
                                <p className="observacao-exercicio">
                                  {exercicio.observacoes}
                                </p>
                              )}

                              {estaExecutandoMesmoTreino && execucao && (
                                <div className="execucao-box">
                                  <div className="execucao-grid">
                                    <div>
                                      <label>Séries concluídas</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={execucao.series_planejadas || 99}
                                        value={execucao.series_concluidas ?? 0}
                                        onChange={(e) =>
                                          atualizarExecucaoLocal(
                                            execucao.id,
                                            "series_concluidas",
                                            Number(e.target.value)
                                          )
                                        }
                                      />
                                    </div>

                                    <div>
                                      <label>Repetições realizadas</label>
                                      <input
                                        type="text"
                                        value={
                                          execucao.repeticoes_realizadas || ""
                                        }
                                        onChange={(e) =>
                                          atualizarExecucaoLocal(
                                            execucao.id,
                                            "repeticoes_realizadas",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>

                                    <div>
                                      <label>Carga realizada</label>
                                      <input
                                        type="text"
                                        value={execucao.carga_realizada || ""}
                                        onChange={(e) =>
                                          atualizarExecucaoLocal(
                                            execucao.id,
                                            "carga_realizada",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="progresso-exercicio-box">
                                    <span>
                                      Progresso do exercício:{" "}
                                      {execucao.series_concluidas || 0}/
                                      {execucao.series_planejadas || 0} séries
                                    </span>

                                    <div className="barra-progresso">
                                      <div
                                        className="barra-progresso-fill"
                                        style={{
                                          width: `${progressoExercicio}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="acoes-execucao">
                                    <label className="check-concluido">
                                      <input
                                        type="checkbox"
                                        checked={!!execucao.concluido}
                                        onChange={(e) =>
                                          atualizarExecucaoLocal(
                                            execucao.id,
                                            "concluido",
                                            e.target.checked
                                          )
                                        }
                                      />
                                      Marcar exercício como concluído
                                    </label>

                                    <button
                                      className="btn-secundario"
                                      onClick={() => salvarExecucao(execucao)}
                                      disabled={
                                        salvandoExecucaoId === execucao.id
                                      }
                                    >
                                      {salvandoExecucaoId === execucao.id
                                        ? "Salvando..."
                                        : "Salvar exercício"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {exercicio.video_url && (
                                <button
                                  type="button"
                                  className="link-video botao-video"
                                  onClick={() =>
                                    setVideoAberto(exercicio.video_url || "")
                                  }
                                >
                                  Assistir vídeo do exercício
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="painel-historico">
                <h3>Histórico</h3>

                {historico.length === 0 ? (
                  <p>Nenhum histórico encontrado.</p>
                ) : (
                  <div className="lista-historico">
                    {historico.map((item) => (
                      <div className="item-historico" key={item.id}>
                        <div className="historico-header">
                          <strong className="historico-treino">
                            {obterNomeTreino(item.treino_id)}
                          </strong>

                          <span className="historico-dia">
                            {formatarDiaExibicao(item.dia_semana)}
                          </span>
                        </div>

                        <div>
                          <strong>Status:</strong> {capitalizar(item.status)}
                        </div>

                        <div>
                          <strong>Duração:</strong>{" "}
                          {item.duracao_segundos
                            ? formatarTempo(item.duracao_segundos)
                            : "-"}
                        </div>

                        <div>
                          <strong>Início:</strong>{" "}
                          {item.iniciado_em
                            ? new Date(item.iniciado_em).toLocaleString("pt-BR")
                            : "-"}
                        </div>

                        <div>
                          <strong>Fim:</strong>{" "}
                          {item.finalizado_em
                            ? new Date(item.finalizado_em).toLocaleString("pt-BR")
                            : "-"}
                        </div>

                        {item.observacoes && (
                          <div>
                            <strong>Obs:</strong> {item.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="painel-detalhes">
              <p>Selecione um treino para visualizar.</p>
            </div>
          )}
        </div>
      </div>

      {videoAberto && (
        <div className="video-modal-overlay" onClick={() => setVideoAberto("")}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>Vídeo do exercício</h3>
              <button
                type="button"
                className="fechar-video"
                onClick={() => setVideoAberto("")}
              >
                ✕
              </button>
            </div>

            <div className="video-container">
              <iframe
                width="100%"
                height="400"
                src={converterYoutubeParaEmbed(videoAberto)}
                title="Vídeo do exercício"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {modalFinalizacaoAberto && (
        <div
          className="video-modal-overlay"
          onClick={() => setModalFinalizacaoAberto(false)}
        >
          <div
            className="video-modal finalizacao-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <h3>Finalizar treino</h3>
              <button
                type="button"
                className="fechar-video"
                onClick={() => setModalFinalizacaoAberto(false)}
              >
                ✕
              </button>
            </div>

            <div className="finalizacao-body">
              <label htmlFor="observacaoFinalizacao">
                Deseja deixar uma observação sobre o treino?
              </label>

              <textarea
                id="observacaoFinalizacao"
                rows="4"
                placeholder="Ex: treino tranquilo, aumentei carga, senti dificuldade em um exercício..."
                value={observacaoFinalizacao}
                onChange={(e) => setObservacaoFinalizacao(e.target.value)}
              />

              <div className="finalizacao-actions">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModalFinalizacaoAberto(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-finalizar"
                  onClick={finalizarTreino}
                >
                  Confirmar finalização
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
