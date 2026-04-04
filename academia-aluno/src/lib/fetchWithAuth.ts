import { getAuthToken, handleExpiredSession } from "./auth";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    handleExpiredSession();
    throw new Error("unauthorized");
  }

  return response;
}
