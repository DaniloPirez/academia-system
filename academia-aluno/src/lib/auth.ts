export function isAuthenticated() {
  return !!localStorage.getItem("cliente_token");
}

export function saveAuth(accessToken: string, refreshToken?: string) {
  localStorage.setItem("cliente_token", accessToken);
  if (refreshToken) {
    localStorage.setItem("cliente_refresh_token", refreshToken);
  }
}

export function clearAuth() {
  localStorage.removeItem("cliente_token");
  localStorage.removeItem("cliente_refresh_token");
}