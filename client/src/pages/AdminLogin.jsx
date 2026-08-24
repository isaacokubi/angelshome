import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!data?.token) throw new Error("Authentication failed. Please try again.");
      localStorage.setItem("adminToken", data.token);
      navigate(location.state?.from?.pathname || "/admin/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
          <section className="hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Angels Home Education Centre</p>
              <h1 className="mt-5 text-4xl font-black leading-tight">School administration, in one secure command centre.</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-blue-100">Manage learning, families, staff, sponsorship, communications and school operations from a single professional workspace.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Family coordination", "Parents & pupils"],
                ["Academic oversight", "Learning & records"],
                ["Communications", "Announcements"],
                ["Operations", "School-wide visibility"],
              ].map(([title, note]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="font-black">{title}</p><p className="mt-1 text-xs text-blue-200">{note}</p></div>)}
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8 lg:hidden"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Angels Home Education Centre</p></div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Administrator access</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to manage the school platform securely.</p>

              <form onSubmit={login} className="mt-8 space-y-5">
                <label className="block"><span className="text-sm font-bold text-slate-700">Administrator email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" autoFocus required disabled={loading} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60" placeholder="admin@school.example" /></label>
                <label className="block"><span className="text-sm font-bold text-slate-700">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required disabled={loading} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60" placeholder="Enter your password" /></label>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">{error}</div>}

                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
                  {loading ? "Signing you in…" : "Sign in securely"}
                </button>
              </form>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-500">
                <Link to="/" className="font-bold text-blue-800 hover:text-blue-950">← Back to school website</Link>
                <span>Protected administrator area</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
