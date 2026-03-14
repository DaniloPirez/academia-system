import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type AccessItem = {
  id: string;
  data_entrada: string;
  status: string;
};

type Props = {
  acessos?: AccessItem[];
};

function buildChartData(acessos: AccessItem[] = []) {
  const grouped = new Map<string, number>();

  acessos.forEach((item) => {
    const date = new Date(item.data_entrada);
    const key = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    grouped.set(key, (grouped.get(key) || 0) + 1);
  });

  return Array.from(grouped.entries()).map(([data, total]) => ({
    data,
    total,
  }));
}

export default function FrequencyChart({ acessos = [] }: Props) {
  const data = buildChartData(acessos);

  if (!data.length) {
    return <div className="empty-box">Sem dados suficientes para o gráfico.</div>;
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="data" stroke="#94a3b8" />
          <YAxis allowDecimals={false} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "14px",
              color: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}