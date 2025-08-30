import { postRegister } from './shared/api';
const BASE = (import.meta?.env?.VITE_API_BASE_URL) || "http://127.0.0.1:8000";

export async function register(payload) {
  const res = await fetch(\\/auth/register\, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map(d => d.msg || d?.loc?.join(".")).join("; ")
      : data?.detail || \Register failed (\)\;
    throw new Error(detail);
  }

  return data; // { id, username, email, is_verified }
}


