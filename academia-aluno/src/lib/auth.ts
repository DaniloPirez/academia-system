export const TOKEN_KEY = "cliente_token";
export const REFRESH_TOKEN_KEY = "cliente_refresh_token";
export const AUTH_EXPIRED_MESSAGE_KEY = "auth_expired_message";

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(accessToken: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function handleExpiredSession(message = "Sessão expirada. Faça login novamente.") {
  clearAuth();
  sessionStorage.setItem(AUTH_EXPIRED_MESSAGE_KEY, message);

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export function consumeAuthExpiredMessage() {
  const message = sessionStorage.getItem(AUTH_EXPIRED_MESSAGE_KEY);

  if (message) {
    sessionStorage.removeItem(AUTH_EXPIRED_MESSAGE_KEY);
  }

  return message;
}
