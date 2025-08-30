const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

function join(base: string, path: string) {
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = join(API_BASE, path);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return data as T;
}
