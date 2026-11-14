const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const API_ORIGIN = new URL(API_BASE, window.location.origin).origin;
let accessToken = null;
let refreshRequest = null;

export function setAccessToken(token) {
  accessToken = token;
}

async function renewSession() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    }).then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      accessToken = data.accessToken;
      return data;
    }).finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

export async function api(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (typeof options.body === "string") headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await renewSession();
    if (refreshed) return api(path, options, false);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status}).`);
    error.status = response.status;
    error.details = data?.errors;
    throw error;
  }
  return data;
}

export const jsonBody = (body) => JSON.stringify(body);
export async function tryRestoreSession() {
  const data = await renewSession();
  return data?.user || null;
}
