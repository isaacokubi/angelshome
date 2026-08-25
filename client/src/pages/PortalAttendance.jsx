import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PortalShell from "../components/PortalShell";

export default function PortalAttendance({ role }) {
  const [data, setData] = useState({ records: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await apiRequest("/portal/attendance")); }
    catch (e) { setError(e.message || "Unable to load attendance records."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <PortalShell role={role}><div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Live school records</p><h1 className="mt-2 text-3xl font-black text-blue-950">Attendance</h1><p className="mt-2 text-slate-600">Attendance information is fetched directly from the school database.</p></header>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{loading ? <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading attendance…</div> : <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Present",data.summary?.present||0],["Absent",data.summary?.absent||0],["Sick",data.summary?.sick||0],["Late",data.summary?.late||0]].map(([label,value])=><div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-blue-950">{value}</p></div>)}</section><section className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Date</th><th className="p-4">Pupil</th><th className="p-4">Class</th><th className="p-4">Status</th><th className="p-4">Note</th></tr></thead><tbody>{data.records.length ? data.records.map(r=><tr key={r._id} className="border-b last:border-0"><td className="p-4">{new Date(r.date).toLocaleDateString()}</td><td className="p-4 font-bold">{r.pupil?.name || "—"}</td><td className="p-4">{r.schoolClass?.name || "—"}</td><td className="p-4 font-bold capitalize">{r.status}</td><td className="p-4 text-slate-500">{r.note || "—"}</td></tr>) : <tr><td colSpan="5" className="p-8 text-center text-slate-500">No attendance records are available for this account.</td></tr>}</tbody></table></section></>}</div></PortalShell>;
}
