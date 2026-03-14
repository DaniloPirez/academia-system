import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type Acesso = {
  id: string;
  data_entrada: string;
  status: string;
  motivo?: string | null;
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default function AcessosPage() {
  const { data, isLoading, isError } = useQuery<Acesso[]>({
    queryKey: ["cliente-acessos"],
    queryFn: async () => {
      const res = await api.get("/clientes/me/acessos");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Carregando acessos...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Não foi possível carregar o histórico de acessos.</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="dashboard-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Aluno</p>
            <h1>Histórico de acessos</h1>
            <p className="subtitle">Consulte suas entradas registradas na academia.</p>
          </div>
        </div>

        <div className="section-card">
          <div className="list-stack">
            {data?.length ? (
              data.map((item) => (
                <div key={item.id} className="list-row">
                  <strong>{item.status}</strong>
                  <span>{formatDateTime(item.data_entrada)}</span>
                  {item.motivo ? <span>Motivo: {item.motivo}</span> : null}
                </div>
              ))
            ) : (
              <div className="empty-box">Nenhum acesso encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}