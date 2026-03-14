import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export type ClienteMe = {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  status?: string;
  data_vencimento?: string;
  foto?: string | null;
  plano?: {
    id: string;
    nome?: string;
    valor?: number;
    duracao_meses?: number;
  } | null;
};

export function getFotoUrl(foto?: string | null) {
  if (!foto) return null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${base}${foto}`;
}

export function getInitials(name?: string) {
  if (!name) return "AL";

  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function useClienteMe() {
  return useQuery<ClienteMe>({
    queryKey: ["cliente-me"],
    queryFn: async () => {
      const res = await api.get("/clientes/me");
      return res.data;
    },
  });
}