const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

function join(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const trimmed = path.replace(/\/+$/, "");
  const fixed = /^\/auth$/i.test(trimmed) ? "/auth/register" : trimmed; // safety
  const url = join(API_BASE, fixed);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && (data.detail || data.message)) || `HTTP ${res.status}`);
  return data as T;
}
