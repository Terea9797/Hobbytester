import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type User = { id: number; email: string; username?: string | null };

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { if (token) void fetchMe(); }, [token]);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    const access = data.access_token || data.token || data.accessToken;
    if (!access) throw new Error("Missing access token in response");
    localStorage.setItem("access_token", access);
    setToken(access);
    await fetchMe();
    navigate("/home", { replace: true });
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  }

  async function fetchMe() {
    const t = localStorage.getItem("access_token");
    if (!t) return;
    const res = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setUser(await res.json());
  }

  return <Ctx.Provider value={{ user, token, login, logout, fetchMe }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
