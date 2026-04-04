import axios from "axios";
import { getAuthToken, handleExpiredSession } from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://academia-backend-5m3g.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleExpiredSession();
    }

    return Promise.reject(error);
  }
);
