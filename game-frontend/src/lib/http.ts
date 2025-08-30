const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

function join(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function pickMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  // FastAPI style: { detail: [{ msg: "..." }] } or { detail: "..." }
  if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  try { return JSON.stringify(data); } catch { return fallback; }
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = join(API_BASE, path.replace(/\/+$/, ""));
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  const txt = await res.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch {}

  if (!res.ok) {
    const msg = pickMessage(data, `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return (data as T);
}
