import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { smisApi } from "../services/api";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function teacherName(teacher) {
  return teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "—";
}

export default function TimetablePanel({ role }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await smisApi.timetable();
      setRows(Array.isArray(result?.data) ? result.data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load timetable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true).catch(() => {});
    const refresh = () => load(false).catch(() => {});
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [load]);

  const visibleRows = useMemo(() => rows.slice(0, 8), [rows]);

  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live timetable</p><h3 className="mt-1 text-xl font-black text-blue-950">School timetable</h3><p className="mt-1 text-sm text-slate-500">Current timetable records shared from the school database.</p></div>
      <Link to="/admin/smis/timetable" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50">{role === "admin" ? "Manage timetable" : "View full timetable"} →</Link>
    </div>
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    {loading && !rows.length && !error ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-xl bg-slate-100" /><div className="h-20 animate-pulse rounded-xl bg-slate-100" /></div> : visibleRows.length ? <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left"><th className="p-3">Day</th><th className="p-3">Time</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row._id} className="border-b last:border-0"><td className="p-3 font-semibold text-slate-700">{DAYS[row.dayOfWeek] || "—"}</td><td className="p-3">{row.startTime || "—"}–{row.endTime || "—"}</td><td className="p-3">{row.schoolClass?.name || "—"}{row.stream ? ` / ${row.stream}` : ""}</td><td className="p-3 font-semibold text-blue-950">{row.subject?.name || "—"}</td><td className="p-3">{teacherName(row.teacher)}</td></tr>)}</tbody></table></div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No timetable has been configured in the school database yet.</div>}
  </section>;
}
