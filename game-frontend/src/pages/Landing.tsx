import { useState } from "react";
import { api } from "../lib/http";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white flex items-center justify-center">
      <div className="max-w-md w-full bg-zinc-800 p-8 rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">City of Shadows</h1>
        <p className="opacity-80 mb-6 text-center">
          A lightweight GTA-RP–inspired browser RPG. Build your turf. Make a name.
        </p>

        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 rounded bg-zinc-900"
            required
          />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 rounded bg-zinc-900"
            required
          />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 rounded bg-zinc-900"
            required
          />
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full p-2 rounded bg-zinc-900"
            required
          />
          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg">
            Create Account
          </button>
        </form>

        {error && <p className="mt-4 text-red-400">{error}</p>}
        {success && <p className="mt-4 text-green-400">Registration successful! Check your email.</p>}
      </div>
    </div>
  );
}


