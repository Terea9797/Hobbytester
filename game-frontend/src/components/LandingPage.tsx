import { useState, useEffect, useMemo } from 'react';

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

type Message = { kind: "success" | "error"; text: string } | null;

type LandingProps = {
  title?: string;
  subtitle?: string;
  heroSrc?: string;
  apiBaseUrl?: string;
};

function joinUrl(base: string, path: string) {
  if (!base) return path;
  return base.endsWith("/") ? base.slice(0, -1) + path : base + path;
}
async function safeJson(res: Response): Promise<any | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// AC: at least one special symbol, at least one number, max 20 chars
function validatePassword(pw: string) {
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const withinMax = pw.length > 0 && pw.length <= 20;
  return { hasNumber, hasSpecial, withinMax, ok: hasNumber && hasSpecial && withinMax };
}
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const LandingPage: React.FC<LandingProps> = ({
  title = "Your City, Your Story",
  subtitle = "Live the streets. Forge your path. Open-world browser RP.",
  heroSrc = "/assets/hero.png",
  apiBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL ?? "",
}) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const pwState = useMemo(() => validatePassword(registerForm.password), [registerForm.password]);
  const emailOk = useMemo(() => validateEmail(registerForm.email), [registerForm.email]);
  const confirmOk = registerForm.password.length > 0 && registerForm.password === registerForm.confirm;
  const usernameOk = registerForm.username.trim().length > 0;
  const registerEnabled = pwState.ok && emailOk && confirmOk && usernameOk && !busy;

  const api = (p: string) => joinUrl(apiBaseUrl || "", p);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const res = await fetch(api('http://127.0.0.1:8000/auth/'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
        throw new Error(detail);
      }
      if (!data?.access_token) throw new Error("Missing access token from server.");
      localStorage.setItem("token", data.access_token);
      setMessage({ kind: "success", text: "Welcome back! Logging you in…" });
    } catch (err: any) {
      setMessage({ kind: "error", text: String(err?.message ?? err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(null);
    if (!registerEnabled) {
      setBusy(false);
      setMessage({ kind: "error", text: "Please fix form errors before registering." });
      return;
    }
    try {
      const res = await fetch(api('http://127.0.0.1:8000/auth/'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
        throw new Error(detail);
      }
      setMessage({
        kind: "success",
        text: "Account created. Check your email for a confirmation link/code to verify.",
      });
      setTab("login");
      setRegisterForm({ username: "", email: "", password: "", confirm: "" });
    } catch (err: any) {
      setMessage({ kind: "error", text: String(err?.message ?? err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(null);
    try {
      const res = await fetch(api('http://127.0.0.1:8000/auth/'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
        throw new Error(detail);
      }
      setMessage({
        kind: "success",
        text: "If that email exists, we sent a reset link. Check your inbox.",
      });
      setShowForgot(false);
      setForgotEmail("");
    } catch (err: any) {
      setMessage({ kind: "error", text: String(err?.message ?? err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroSrc}')` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="inline-block h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm" />
          <span className="text-lg tracking-wide text-white/80">Project Name</span>
        </div>
        <nav className="hidden gap-6 md:flex">
          <a href="#about" className="text-white/70 hover:text-white">About</a>
          <a href="#community" className="text-white/70 hover:text-white">Community</a>
          <a href="#support" className="text-white/70 hover:text-white">Support</a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-10 px-6 pb-16 pt-8 md:grid-cols-2 md:gap-12 md:pt-16">
        <section className="flex min-h-[40vh] flex-col justify-center">
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80 md:text-xl">{subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setTab("register")}
              className="group rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-lg font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,90,31,0.6)] transition hover:from-orange-400 hover:to-rose-400 focus:outline-none"
            >
              Play Free — Register
            </button>
            <button
              onClick={() => setTab("login")}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-lg font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/10"
            >
              I already have an account
            </button>
          </div>
        </section>

        <section className="relative">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-1 backdrop-blur-xl">
            <div className="rounded-[22px] bg-black/40 p-6 ring-1 ring-white/10">
              <div className="mb-6 inline-flex rounded-xl bg-white/10 p-1 ring-1 ring-white/10">
                <TabButton active={tab === "login"} onClick={() => setTab("login")}>Login</TabButton>
                <TabButton active={tab === "register"} onClick={() => setTab("register")}>Register</TabButton>
              </div>

              {tab === "login" ? (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field label="Username" name="username" value={loginForm.username}
                      onChange={(e) => setLoginForm(s => ({ ...s, [e.target.name]: e.target.value }))}
                      placeholder="Your username" autoComplete="username" />
                    <Field label="Password" name="password" type="password" value={loginForm.password}
                      onChange={(e) => setLoginForm(s => ({ ...s, [e.target.name]: e.target.value }))}
                      placeholder="••••••••" autoComplete="current-password" />
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => setShowForgot(v => !v)} className="text-sm text-white/70 hover:text-white">
                        Forgot password?
                      </button>
                    </div>
                    <PrimaryButton busy={busy} type="submit">Login</PrimaryButton>
                  </form>

                  {showForgot && (
                    <form onSubmit={handleForgot} className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <label className="block text-sm text-white/80">Email</label>
                      <input
                        type="email"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 focus:border-white/30"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                      <button
                        disabled={busy}
                        className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 font-semibold text-white hover:from-orange-400 hover:to-rose-400 disabled:opacity-60"
                      >
                        Send reset link
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <Field label="Username" name="username" value={registerForm.username}
                    onChange={(e) => setRegisterForm(s => ({ ...s, [e.target.name]: e.target.value }))}
                    placeholder="Pick a handle" autoComplete="username" />
                  <Field label="Email" name="email" type="email" value={registerForm.email}
                    onChange={(e) => setRegisterForm(s => ({ ...s, [e.target.name]: e.target.value }))}
                    placeholder="you@example.com" autoComplete="email" />
                  <Field label="Password" name="password" type="password" value={registerForm.password}
                    onChange={(e) => setRegisterForm(s => ({ ...s, [e.target.name]: e.target.value }))}
                    placeholder="Max 20 chars, incl. number & special" autoComplete="new-password" />
                  <ul className="text-xs text-white/70 space-y-1">
                    <li className={pwState.hasNumber ? "text-emerald-300" : ""}>• contains at least one number</li>
                    <li className={pwState.hasSpecial ? "text-emerald-300" : ""}>• contains at least one special symbol</li>
                    <li className={pwState.withinMax ? "text-emerald-300" : ""}>• max 20 characters</li>
                  </ul>
                  <Field label="Confirm Password" name="confirm" type="password" value={registerForm.confirm}
                    onChange={(e) => setRegisterForm(s => ({ ...s, [e.target.name]: e.target.value }))}
                    placeholder="Re-enter your password" autoComplete="new-password" />
                  {(!confirmOk && registerForm.confirm.length > 0) && (
                    <div className="text-xs text-rose-300">Passwords do not match.</div>
                  )}
                  <button
                    disabled={!registerEnabled}
                    type="submit"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-base font-semibold text-white shadow-[0_25px_60px_-25px_rgba(255,90,31,0.65)] transition hover:from-orange-400 hover:to-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create Account
                  </button>
                  <p className="pt-1 text-xs text-white/60">
                    By creating an account, you agree to our <a href="/terms" className="underline hover:text-white">Terms</a> and <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
                  </p>
                </form>
              )}

              {message && (
                <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  message.kind === "success"
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/10 bg-black/30 py-8 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/60 md:flex-row">
          <div>© {new Date().getFullYear()} Your Studio</div>
          <div className="flex items-center gap-6">
            <a href="https://discord.gg/yourserver" className="hover:text-white">Discord</a>
            <a href="/support" className="hover:text-white">Support</a>
            <a href="/docs" className="hover:text-white">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
};

function Field({ label, name, type = "text", value, onChange, placeholder, autoComplete }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
      />
    </label>
  );
}

function TabButton({ active, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

/** Primary gradient CTA used in Login form */
function PrimaryButton(
  { children, busy, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }
) {
  return (
    <button
      disabled={busy || props.disabled}
      {...props}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-base font-semibold text-white shadow-[0_25px_60px_-25px_rgba(255,90,31,0.65)] transition hover:from-orange-400 hover:to-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
      <span className="translate-y-[1px] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
    </button>
  );
}






import { api } from "../lib/http";
