import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "./PortalShell";
import AdminDashboard from "./AdminDashboard";
import SharedSchoolSnapshot from "./SharedSchoolSnapshot";
import TimetablePanel from "./TimetablePanel";
import { portalApi } from "../services/api";

export default function PortalDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    return portalApi.dashboard().then((result) => { setData(result); setError(""); }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    let active = true;
    load(true).catch(() => {});
    const refresh = () => { if (active) load(false).catch(() => {}); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [load]);

  const role = data?.profile?.role || "pupil";
  return <PortalShell role={role}>
    {loading && !data && <div className="space-y-5"><div className="h-44 animate-pulse rounded-3xl bg-slate-200" /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div></div>}
    {error && !data && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700"><p>{error}</p><button onClick={() => load(true)} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-white">Try again</button></div>}
    {data && role === "admin" && <><AdminDashboard data={data} /><TimetablePanel role={role} /></>}
    {data && role !== "admin" && <StandardDashboard data={data} role={role} />}
  </PortalShell>;
}

function StandardDashboard({ data, role }) {
  const recentResults = data?.results?.recent || [];
  return <>
    <div className="mb-8"><p className="text-sm font-bold text-amber-600">{data?.profile?.name ? `WELCOME BACK, ${data.profile.name.toUpperCase()}` : "SCHOOL PORTAL"}</p><h2 className="mt-1 text-3xl font-black text-blue-950">{role === "pupil" ? "My learning" : `${data?.profile?.roleLabel || "School"} dashboard`}</h2><p className="mt-2 max-w-2xl text-slate-600">Your portal information is loaded from the school database and reflects your current account.</p></div>
    <SharedSchoolSnapshot data={data} role={role} />
    <TimetablePanel role={role} />
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-blue-950">Recent examination results</h3><p className="mt-1 text-xs text-slate-500">Live from the school assessment records.</p></div><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{recentResults.length ? recentResults.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">{item.subject?.name || "Subject"}</p><p className="mt-1 text-xs text-slate-500">{item.exam?.name || "Examination"}{item.pupil?.name ? ` · ${item.pupil.name}` : ""}</p></div><div className="text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">{item.grade || "—"}</p></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No examination results have been recorded for this account yet.</div>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-4">{data.notifications?.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No school activity has been published for your account.</div>}</div></section>
    </div>
  </>;
}
