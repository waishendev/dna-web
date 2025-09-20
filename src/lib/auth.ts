const TOKEN_STORAGE_KEY = "dna_web_token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to read auth token", error);
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("Failed to store auth token", error);
  }
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear auth token", error);
  }
}

export function hasToken(): boolean {
  return getToken() != null;
}

export { TOKEN_STORAGE_KEY };
