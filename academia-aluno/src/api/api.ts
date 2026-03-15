import axios from "axios"

export const api = axios.create({
  baseURL: "https://academia-backend-5m3g.onrender.com",
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("cliente_token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
