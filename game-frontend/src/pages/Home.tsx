import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome{user?.username ? `, ${user.username}` : ""} 👋</h1>
        <button onClick={logout} className="rounded-lg bg-rose-600 px-3 py-2">Logout</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-2 text-lg font-medium">Getting started</h2>
          <ol className="list-decimal space-y-1 pl-5 text-white/90">
            <li>Confirm your email (done ✅)</li>
            <li>Explore the city map (coming next)</li>
            <li>Run your first action (Travel → Pickpocket)</li>
          </ol>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-2 text-lg font-medium">Your account</h2>
          <div className="space-y-1 text-white/90">
            <div><span className="text-white/60">ID:</span> {user?.id}</div>
            <div><span className="text-white/60">Email:</span> {user?.email}</div>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-lg font-medium">Next up</h2>
        <p className="text-white/80">
          We’ll add the World Map and your first timed actions (Travel, Pickpocket). This page will grow into your dashboard.
        </p>
      </section>
    </div>
  );
}
