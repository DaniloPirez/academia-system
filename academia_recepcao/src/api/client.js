import axios from "axios";

const api = axios.create({
  baseURL: "https://academia-backend-5m3g.onrender.com",
});

function clearSessionAndRedirect() {
  localStorage.removeItem("access_token");
  sessionStorage.setItem("auth_expired_message", "Sessão expirada. Faça login novamente.");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default api;
