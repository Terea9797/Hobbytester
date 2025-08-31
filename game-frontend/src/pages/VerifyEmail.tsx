import { useEffect, useState } from "react";
import { api } from "../lib/http";

type State = "idle" | "ok" | "already" | "error";

export default function VerifyEmail() {
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("Verifying...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setState("error");
      setMsg("Missing token.");
      return;
    }
    (async () => {
      try {
        // Backend uses GET /auth/confirm-email?token=...
        const res = await api<{ status: string }>(`/auth/confirm-email?token=${encodeURIComponent(token)}`);
        if (res?.status === "email_confirmed") {
          setState("ok");
          setMsg("Email verified! You can now log in.");
        } else {
          setState("error");
          setMsg("Unexpected response.");
        }
      } catch (e: any) {
        const text = e?.message || "Verification failed.";
        // If your backend ever returns 'already verified', map it here if needed
        setState(text.toLowerCase().includes("already") ? "already" : "error");
        setMsg(text);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-white/5">
        <h1 className="text-2xl font-bold mb-2">Email Verification</h1>
        <p className="text-white/80">{msg}</p>
        {(state === "ok" || state === "already") && (
          <a href="/login" className="mt-6 inline-block rounded-xl bg-white text-black px-4 py-2">Go to Login</a>
        )}
      </div>
    </div>
  );
}
