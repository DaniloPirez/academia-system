import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CreditCard,
  Activity,
  ShieldCheck,
  TriangleAlert,
  MessageCircleMore,
} from "lucide-react";
import { api } from "../lib/api";
import FrequencyChart from "../components/FrequencyChart";
import { useClienteMe, getFotoUrl, getInitials } from "../hooks/useClienteMe";

type DashboardResponse = {
  nome?: string;
  plano_atual?: string;
  data_vencimento?: string;
  status?: string;
  frequencia_total?: number;
  ultimos_acessos?: Array<{
    id: string;
    data_entrada: string;
    status: string;
  }>;
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

function getDaysUntilDue(dateString?: string) {
  if (!dateString) return null;

  const today = new Date();
  const due = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDueMessage(dateString?: string) {
  const days = getDaysUntilDue(dateString);

  if (days === null) return "Sem vencimento informado.";
  if (days < 0) return `Seu plano venceu há ${Math.abs(days)} dia(s).`;
  if (days === 0) return "Seu plano vence hoje.";
  if (days <= 3) return `Seu plano vence em ${days} dia(s).`;
  return `Próximo vencimento em ${days} dia(s).`;
}

function getDueTone(dateString?: string) {
  const days = getDaysUntilDue(dateString);

  if (days === null) return "neutral";
  if (days < 0) return "danger";
  if (days <= 3) return "warning";
  return "success";
}

function getWhatsAppLink() {
  const numero = import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999";
  const mensagem = encodeURIComponent(
    "Olá! Preciso de ajuda com minha área do aluno."
  );
  return `https://wa.me/${numero}?text=${mensagem}`;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardResponse>({
    queryKey: ["cliente-dashboard"],
    queryFn: async () => {
      const res = await api.get("/clientes/me/dashboard");
      return res.data;
    },
  });

  const { data: clienteMe } = useClienteMe();

  if (isLoading) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Carregando dashboard...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-wrap">
        <div className="loading-box">
          Não foi possível carregar o dashboard. Verifique o backend e o token do cliente.
        </div>
      </div>
    );
  }

  const dueTone = getDueTone(data?.data_vencimento);
  const showPendingBanner = dueTone === "warning" || dueTone === "danger";
  const fotoUrl = getFotoUrl(clienteMe?.foto);

  return (
    <div className="page-wrap">
      <div className="dashboard-shell premium-shell">
        <section className="hero-premium">
          <div className="hero-premium-top">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={clienteMe?.nome || "Aluno"}
                className="hero-avatar-image"
              />
            ) : (
              <div className="hero-avatar">
                {getInitials(clienteMe?.nome || data?.nome)}
              </div>
            )}

            <div className="hero-premium-content">
              <p className="eyebrow">Painel do aluno</p>
              <h1>Olá, {data?.nome || "Aluno"}</h1>
              <p className="subtitle">
                Acompanhe seu plano, vencimento, frequência e pagamentos em um só lugar.
              </p>

              <div className="hero-tags">
                <span className="hero-tag">
                  <ShieldCheck size={16} />
                  {data?.status || "Status não informado"}
                </span>

                <span className="hero-tag">
                  <CreditCard size={16} />
                  {data?.plano_atual || "Sem plano"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={`due-banner ${dueTone}`}>
          <div className="due-banner-icon">
            <TriangleAlert size={18} />
          </div>

          <div>
            <strong>Vencimento do plano</strong>
            <p>{getDueMessage(data?.data_vencimento)}</p>
          </div>
        </section>

        {showPendingBanner ? (
          <section className="pending-banner">
            <div>
              <strong>Pagamento pendente ou vencimento próximo</strong>
              <p>Verifique sua área de pagamentos para evitar bloqueios no acesso.</p>
            </div>
            <a className="pending-banner-button" href="/pagamentos">
              Ver pagamentos
            </a>
          </section>
        ) : null}

        <div className="stats-grid premium-stats">
          <div className="stat-card gradient-card blue-card">
            <div className="stat-icon">
              <CreditCard size={18} />
            </div>
            <span>Plano atual</span>
            <strong>{data?.plano_atual || "Sem plano"}</strong>
          </div>

          <div className="stat-card gradient-card amber-card">
            <div className="stat-icon">
              <CalendarDays size={18} />
            </div>
            <span>Vencimento</span>
            <strong>{formatDate(data?.data_vencimento)}</strong>
          </div>

          <div className="stat-card gradient-card green-card">
            <div className="stat-icon">
              <ShieldCheck size={18} />
            </div>
            <span>Status</span>
            <strong>{data?.status || "-"}</strong>
          </div>

          <div className="stat-card gradient-card purple-card">
            <div className="stat-icon">
              <Activity size={18} />
            </div>
            <span>Frequência</span>
            <strong>{data?.frequencia_total || 0} acessos</strong>
          </div>
        </div>

        <div className="dashboard-columns">
          <section className="section-card premium-card">
            <div className="section-header-row">
              <div>
                <p className="eyebrow">Atividade</p>
                <h2>Últimos acessos</h2>
              </div>
            </div>

            <div className="list-stack">
              {data?.ultimos_acessos?.length ? (
                data.ultimos_acessos.map((item) => (
                  <div key={item.id} className="list-row premium-row">
                    <div className="access-status-dot" />
                    <div>
                      <strong>{item.status}</strong>
                      <span>{formatDateTime(item.data_entrada)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-box">Nenhum acesso registrado.</div>
              )}
            </div>
          </section>

          <section className="section-card premium-card side-info-card">
            <p className="eyebrow">Resumo rápido</p>
            <h2>Seu momento atual</h2>

            <div className="summary-stack">
              <div className="summary-item">
                <span>Plano</span>
                <strong>{data?.plano_atual || "Sem plano"}</strong>
              </div>

              <div className="summary-item">
                <span>Status</span>
                <strong>{data?.status || "-"}</strong>
              </div>

              <div className="summary-item">
                <span>Vencimento</span>
                <strong>{formatDate(data?.data_vencimento)}</strong>
              </div>

              <div className="summary-item">
                <span>Total de acessos</span>
                <strong>{data?.frequencia_total || 0}</strong>
              </div>
            </div>

            <a
              className="whatsapp-cta"
              href={getWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircleMore size={18} />
              <span>Falar com a academia</span>
            </a>
          </section>
        </div>

        <section className="section-card premium-card chart-section">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">Frequência</p>
              <h2>Evolução dos acessos</h2>
            </div>
          </div>

          <FrequencyChart acessos={data?.ultimos_acessos || []} />
        </section>
      </div>
    </div>
  );
}