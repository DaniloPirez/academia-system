import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import api from "../api/client";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function RevenueChart() {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await api.get("/dashboard/receita-mensal");
      setDados(res.data);
    } catch (err) {
      console.error("Erro ao carregar gráfico", err);
    }
  }

  const chartData = {
    labels: dados.map(d => d.mes),
    datasets: [
      {
        label: "Receita Mensal",
        data: dados.map(d => d.total),
        borderRadius: 8
      }
    ]
  };

  return (
    <div style={{ padding: 20 }}>
      <Bar data={chartData} />
    </div>
  );
}