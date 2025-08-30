//
// ========================== PREVIOUS src/lib/api.ts (commented) ==========================
// //
// // ========================== PREVIOUS api.ts (embedded) ==========================
// // (This block was auto-inserted. Your original file is also saved as api.ts.bak)
// const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
// 
// export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
//   const token = localStorage.getItem('token');
//   const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
//   if (token) headers['Authorization'] = `Bearer ${token}`;
//   const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }
// 
// 
// 
// // ======================== END PREVIOUS api.ts (embedded) ========================
// 
// /**
//  * src/lib/api.ts (FULL FILE, updated)
//  * - Central fetch helper.
//  * - Ensures relative paths like '/auth/login' are sent to the backend base URL.
//  * - Keeps your components (Landing/Login/Register) unchanged.
//  */
// 
// const API_BASE: string =
//   (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
// 
// function joinUrl(base: string, path: string): string {
//   if (/^https?:\/\//i.test(path)) return path;  // already absolute
//   if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
//   if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
//   return base + path;
// }
// 
// export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
//   const url = joinUrl(API_BASE, path);
// 
//   const headers: Record<string,string> = {
//     'Content-Type': 'application/json',
//     ...(init?.headers as any || {}),
//   };
// 
//   const res = await fetch(url, { ...init, headers });
//   const text = await res.text();
// 
//   let data: any;
//   try { data = JSON.parse(text); } catch { data = text; }
// 
//   if (!res.ok) {
//     const msg =
//       Array.isArray((data as any)?.detail)
//         ? (data as any).detail.map((d: any) => d?.msg || d?.loc?.join('.')).join('; ')
//         : ((data as any)?.detail || \HTTP \\);
//     throw new Error(msg);
//   }
// 
//   return data as T;
// }
// 
// ======================== END PREVIOUS src/lib/api.ts (commented) ========================

/**
 * src/lib/api.ts — FULL FILE (fixed)
 * - Keeps your components unchanged (they call api('/auth/...') as in your code).
 * - Automatically prefixes relative paths with your backend base URL.
 */

const API_BASE: string =
  (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;  // already absolute
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  return base + path;
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = joinUrl(API_BASE, path);

  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as any || {}),
  };

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();

  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const msg =
      Array.isArray((data as any)?.detail)
        ? (data as any).detail.map((d: any) => d?.msg || d?.loc?.join('.')).join('; ')
        : ((data as any)?.detail || HTTP );
    throw new Error(msg);
  }

  return data as T;
}
import { api } from "../lib/http";




