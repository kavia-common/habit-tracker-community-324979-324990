/**
 * Minimal API client wrapper around fetch().
 * - Stores auth token in localStorage
 * - Adds Authorization header automatically
 * - Provides a consistent error shape for UI
 *
 * Backend note:
 * The currently provided OpenAPI spec only includes GET /. This client supports
 * a richer app API, but will gracefully fall back to local demo data when endpoints
 * are missing/unavailable.
 */

const TOKEN_KEY = "hb_token";

/** PUBLIC_INTERFACE */
export function getApiBaseUrl() {
  /**
   * Returns the base URL for the backend.
   * If REACT_APP_API_BASE_URL is not set, defaults to same-origin.
   */
  return (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");
}

/** PUBLIC_INTERFACE */
export function getToken() {
  /** Get stored bearer token (if any). */
  return localStorage.getItem(TOKEN_KEY);
}

/** PUBLIC_INTERFACE */
export function setToken(token) {
  /** Store bearer token. */
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

/** PUBLIC_INTERFACE */
export function clearToken() {
  /** Clear bearer token. */
  localStorage.removeItem(TOKEN_KEY);
}

/** PUBLIC_INTERFACE */
export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  /**
   * Perform an API request and return JSON when possible.
   * Throws an Error with {status, data} when HTTP fails.
   */
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;

  const token = getToken();
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** PUBLIC_INTERFACE */
export async function healthCheck() {
  /** Calls GET / on the backend. */
  return apiRequest("/", { method: "GET" });
}
