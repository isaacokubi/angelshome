import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "./PortalShell";
import { portalApi } from "../services/api";

export default function PortalDashboard() {
  const [data, setData] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; portalApi.dashboard().then((result) => { if (active) setData(result); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const role = data?.profile?.role || "pupil";
  return <PortalShell role={role}>
    <div className="mb-8"><p className="text-sm font-bold text-amber-600">{data?.profile?.name ? `WELCOME BACK, ${data.profile.name.toUpperCase()}` : "SCHOOL PORTAL"}</p><h2 className="mt-1 text-3xl font-black text-blue-950">{role === "pupil" ? "My learning" : `${data?.profile?.roleLabel || "School"} dashboard`}</h2><p className="mt-2 max-w-2xl text-slate-600">Your portal information is loaded from the school database and reflects your current account.</p></div>
    {loading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading your school records…</div>}
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error}</div>}
    {!loading && !error && data && <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{data.stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">{stat.label}</p><p className="mt-3 text-3xl font-black text-blue-950">{stat.value}</p><p className="mt-2 text-xs font-semibold text-slate-500">{stat.note}</p></div>)}</div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-4">{data.notifications.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" /></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No school activity has been published for your account.</div>}</div></section>
      <section className="rounded-2xl bg-blue-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-amber-400">School office</p><h3 className="mt-2 text-xl font-black">Need assistance?</h3><p className="mt-3 text-sm leading-6 text-blue-100">Contact the school through the official contact channel configured for this deployment.</p>{import.meta.env.VITE_SCHOOL_WHATSAPP ? <a href={`https://wa.me/${String(import.meta.env.VITE_SCHOOL_WHATSAPP).replace(/\D/g, "")}?text=${encodeURIComponent(`Hello Angels Home Education Centre. I am ${data.profile.name} and need assistance with my school portal account.`)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950">Message on WhatsApp</a> : <Link to="/contact" className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950">Contact the school</Link>}</section></div>
    </>}
  </PortalShell>;
}
