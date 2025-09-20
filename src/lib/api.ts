import { clearToken, getToken } from "./auth";

export type ApiRequestInit = RequestInit & {
  /**
   * When true, the Authorization header will not be automatically attached.
   */
  skipAuth?: boolean;
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

function resolveUrl(path: string): string {
  if (/^https?:/i.test(path)) {
    return path;
  }

  if (!apiBase) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  if (!path.startsWith("/")) {
    return `${apiBase}/${path}`;
  }

  return `${apiBase}${path}`;
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  clearToken();

  if (window.location.pathname === "/login") {
    return;
  }

  window.location.href = "/login";
}

export async function apiFetch(path: string, init: ApiRequestInit = {}) {
  const { skipAuth, headers, ...rest } = init;
  const requestHeaders = new Headers(headers ?? {});

  if (!skipAuth) {
    const token = getToken();
    if (token && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = resolveUrl(path);
  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (!skipAuth && response.status === 401) {
    redirectToLogin();
  }

  return response;
}

export async function apiGetJson<T>(path: string, init: ApiRequestInit = {}) {
  const response = await apiFetch(path, { ...init, method: init.method ?? "GET" });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl() {
  return apiBase;
}
