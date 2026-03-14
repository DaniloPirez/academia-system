import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type Pagamento = {
  id: string;
  valor: number;
  status: string;
  competencia?: string | null;
  vencimento?: string | null;
  data_pagamento?: string | null;
  plano_nome?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PagamentosPage() {
  const [aba, setAba] = useState<"pendente" | "aprovado">("pendente");

  const { data, isLoading, isError } = useQuery<Pagamento[]>({
    queryKey: ["cliente-pagamentos"],
    queryFn: async () => {
      const res = await api.get("/clientes/me/pagamentos");
      return res.data;
    },
  });

  const pagamentosFiltrados = useMemo(() => {
    return (data || []).filter((item) => item.status === aba);
  }, [data, aba]);

  if (isLoading) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Carregando pagamentos...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Não foi possível carregar os pagamentos.</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="dashboard-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Aluno</p>
            <h1>Pagamentos</h1>
            <p className="subtitle">Acompanhe cobranças pendentes e pagamentos aprovados.</p>
          </div>
        </div>

        <div className="section-card">
          <div className="tabs">
            <button
              className={aba === "pendente" ? "active" : ""}
              onClick={() => setAba("pendente")}
            >
              Pendentes
            </button>

            <button
              className={aba === "aprovado" ? "active" : ""}
              onClick={() => setAba("aprovado")}
            >
              Aprovados
            </button>
          </div>

          <div className="list-stack">
            {pagamentosFiltrados.length ? (
              pagamentosFiltrados.map((item) => (
                <div key={item.id} className="payment-card">
                  <div className="payment-top">
                    <strong>{item.plano_nome || "Plano"}</strong>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </div>

                  <span>Competência: {item.competencia || "-"}</span>
                  <span>Valor: {formatMoney(item.valor)}</span>
                  <span>Vencimento: {formatDate(item.vencimento)}</span>
                  <span>Pagamento: {formatDate(item.data_pagamento)}</span>
                </div>
              ))
            ) : (
              <div className="empty-box">Nenhum pagamento nesta aba.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}