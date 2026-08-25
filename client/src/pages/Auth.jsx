import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../services/api";

function Spinner() {
  return <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

const normalizePhone = (value) => value.replace(/[\s()-]/g, "").trim();

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await authApi.login({ email: email.trim(), password });
      localStorage.setItem("angelshome_token", result.token);
      localStorage.setItem("angelshome_session", JSON.stringify(result.user));
      navigate(`/portal/${result.user.role}`, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your secure Angels Home portal and stay connected with your school community.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Field label="Email address" type="email" value={email} onChange={setEmail} required autoComplete="email" disabled={loading} />
        <div>
          <Field label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} required autoComplete="current-password" disabled={loading} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={loading} className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-900 disabled:opacity-50">{showPassword ? "Hide password" : "Show password"}</button>
        </div>
        <button type="submit" disabled={loading || !email.trim() || !password} className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-950 px-5 py-3.5 font-black text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <><Spinner /> Signing you in…</> : "Sign in"}
        </button>
        <p className="text-center text-sm text-slate-600">New to the portal? <Link className="font-bold text-blue-700 hover:text-blue-900" to="/register">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = ["pupil", "parent", "teacher", "sponsor"].includes(params.get("role")) ? params.get("role") : "pupil";
  const [form, setForm] = useState({ name: "", email: "", phone: "", parentPhone: "", password: "", role: initialRole });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    const phone = normalizePhone(form.phone);
    const parentPhone = normalizePhone(form.parentPhone);
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      setError("Enter a valid phone number, including the country code where possible (for example +254712345678).");
      return;
    }
    if (form.role === "pupil" && !/^\+?[0-9]{9,15}$/.test(parentPhone)) {
      setError("Pupils must provide a valid parent or guardian phone number.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone,
        ...(form.role === "pupil" ? { parentPhone } : {}),
      };
      const result = await authApi.register(payload);
      localStorage.setItem("angelshome_token", result.token);
      localStorage.setItem("angelshome_session", JSON.stringify(result.user));
      navigate(`/portal/${result.user.role}`, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your portal account" subtitle="Create a secure account to access school updates, communication and role-specific services.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} required autoComplete="name" disabled={loading} />
        <Field label="Email address" type="email" value={form.email} onChange={(v) => update("email", v)} required autoComplete="email" disabled={loading} />
        <Field label="Phone number" type="tel" value={form.phone} onChange={(v) => update("phone", v)} required autoComplete="tel" inputMode="tel" placeholder="+254 712 345 678" disabled={loading} />
        <p className="-mt-3 text-xs leading-5 text-slate-500">Used for important school communication and account support.</p>
        {form.role === "pupil" && (
          <div>
            <Field label="Parent / guardian phone number" type="tel" value={form.parentPhone} onChange={(v) => update("parentPhone", v)} required autoComplete="tel" inputMode="tel" placeholder="+254 712 345 678" disabled={loading} />
            <p className="mt-2 text-xs leading-5 text-slate-500">A parent or guardian contact is required so the school can link and reach your family account.</p>
          </div>
        )}
        <div>
          <label htmlFor="portal-role" className="mb-2 block text-sm font-bold text-slate-700">Portal role</label>
          <select id="portal-role" value={form.role} onChange={(e) => update("role", e.target.value)} disabled={loading} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50">
            <option value="pupil">Pupil</option>
            <option value="parent">Parent</option>
            <option value="teacher">Teacher</option>
            <option value="sponsor">Sponsor</option>
          </select>
        </div>
        <div>
          <Field label="Password" type={showPassword ? "text" : "password"} value={form.password} onChange={(v) => update("password", v)} required autoComplete="new-password" disabled={loading} minLength={8} />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Use at least 8 characters.</p>
            <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={loading} className="text-xs font-bold text-blue-700 disabled:opacity-50">{showPassword ? "Hide" : "Show"}</button>
          </div>
        </div>
        <button type="submit" disabled={loading || !form.name.trim() || !form.email.trim() || !form.phone.trim() || (form.role === "pupil" && !form.parentPhone.trim()) || form.password.length < 8} className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-950 px-5 py-3.5 font-black text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <><Spinner /> Creating your account…</> : "Create account"}
        </button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link className="font-bold text-blue-700 hover:text-blue-900" to="/login">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}

function Field({ label, type = "text", value, onChange, required, autoComplete, disabled, minLength, inputMode, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input required={required} minLength={minLength} type={type} value={value} placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50" />
    </div>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 md:p-9">
          <div className="mb-7 border-b border-slate-100 pb-5">
            <Link to="/" className="inline-flex items-center text-sm font-black text-amber-600 transition hover:text-amber-700">← Angels Home Education Centre</Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Secure school portal</p>
            <h1 className="mt-2 text-3xl font-black text-blue-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
