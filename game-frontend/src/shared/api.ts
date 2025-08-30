import { postRegister } from './shared/api';
const BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function postRegister(payload: {
  username: string; email: string; password: string; confirmPassword: string;
}) {
  const res = await fetch(\\/auth/register\, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: any; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = Array.isArray(data?.detail)
      ? data.detail.map((d: any) => d.msg || d?.loc?.join('.')).join('; ')
      : (data?.detail || \Register failed (\)\);
    throw new Error(msg);
  }
  return data as { id:number; username:string; email:string; is_verified:boolean };
}


