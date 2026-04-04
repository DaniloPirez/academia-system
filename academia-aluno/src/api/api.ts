import axios from "axios";

export const api = axios.create({
  baseURL: "https://academia-backend-5m3g.onrender.com",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("cliente_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cliente_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");

      const rotaAtual = window.location.pathname;

      if (rotaAtual !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);