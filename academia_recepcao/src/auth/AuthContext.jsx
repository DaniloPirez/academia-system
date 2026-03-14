import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      // Você precisa ter esse endpoint no backend:
      // GET /usuarios/me (retorna {id, nome, email, tipo})
      const res = await api.get("/usuarios/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, senha) {
    // FastAPI OAuth2PasswordRequestForm espera x-www-form-urlencoded
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", senha);

    const res = await api.post("/usuarios/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("access_token", res.data.access_token);
    await fetchMe();
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
  }

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}