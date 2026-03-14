import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Camera, Image as ImageIcon, User } from "lucide-react";
import { api } from "../lib/api";

type ClienteMe = {
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

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getFotoUrl(foto?: string | null) {
  if (!foto) return null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${base}${foto}`;
}

function getInitials(name?: string) {
  if (!name) return "AL";

  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function PerfilPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const galeriaRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, isError } = useQuery<ClienteMe>({
    queryKey: ["cliente-me"],
    queryFn: async () => {
      const res = await api.get("/clientes/me");
      return res.data;
    },
  });

  async function handleLogout() {
    try {
      await api.post("/clientes/me/logout");
    } catch {
    } finally {
      localStorage.removeItem("cliente_token");
      localStorage.removeItem("cliente_refresh_token");
      navigate("/login");
    }
  }

  async function enviarFoto(file: File) {
    try {
      setUploading(true);
      setPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("foto", file);

      await api.post("/clientes/me/foto", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["cliente-me"] });
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      alert("Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  function onChangeArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    enviarFoto(file);
  }

  if (isLoading) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Carregando perfil...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-wrap">
        <div className="loading-box">Não foi possível carregar os dados do perfil.</div>
      </div>
    );
  }

  const fotoUrl = preview || getFotoUrl(data?.foto);

  return (
    <div className="page-wrap">
      <div className="dashboard-shell premium-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Aluno</p>
            <h1>Meu perfil</h1>
            <p className="subtitle">Seus dados cadastrais e informações do plano.</p>
          </div>
        </div>

        <div className="section-card premium-card">
          <div className="profile-top">
            <div className="profile-avatar-wrap">
              {fotoUrl ? (
                <img src={fotoUrl} alt={data?.nome || "Aluno"} className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar-fallback">
                  {data?.nome ? getInitials(data.nome) : <User size={28} />}
                </div>
              )}
            </div>

            <div className="profile-top-info">
              <h2>{data?.nome || "Aluno"}</h2>
              <p>{data?.email || "-"}</p>

              <div className="profile-photo-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => galeriaRef.current?.click()}
                  disabled={uploading}
                >
                  <ImageIcon size={18} />
                  <span>{uploading ? "Enviando..." : "Escolher foto"}</span>
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => cameraRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera size={18} />
                  <span>{uploading ? "Enviando..." : "Tirar foto"}</span>
                </button>
              </div>

              <input
                ref={galeriaRef}
                type="file"
                accept="image/*"
                onChange={onChangeArquivo}
                style={{ display: "none" }}
              />

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onChangeArquivo}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-item">
              <label>Nome</label>
              <strong>{data?.nome || "-"}</strong>
            </div>

            <div className="profile-item">
              <label>E-mail</label>
              <strong>{data?.email || "-"}</strong>
            </div>

            <div className="profile-item">
              <label>Telefone</label>
              <strong>{data?.telefone || "-"}</strong>
            </div>

            <div className="profile-item">
              <label>Status</label>
              <strong>{data?.status || "-"}</strong>
            </div>

            <div className="profile-item">
              <label>Vencimento</label>
              <strong>{formatDate(data?.data_vencimento)}</strong>
            </div>

            <div className="profile-item">
              <label>Plano</label>
              <strong>{data?.plano?.nome || "-"}</strong>
            </div>

            <div className="profile-item">
              <label>Valor do plano</label>
              <strong>{formatMoney(data?.plano?.valor)}</strong>
            </div>

            <div className="profile-item">
              <label>Duração</label>
              <strong>{data?.plano?.duracao_meses ? `${data.plano.duracao_meses} mês(es)` : "-"}</strong>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}