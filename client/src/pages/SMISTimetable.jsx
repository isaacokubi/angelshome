import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { smisApi } from "../services/api";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function teacherName(teacher) {
  return teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "—";
}

export default function SMISTimetable({ role = "pupil" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setError(""); const result = await smisApi.timetable(); setRows(Array.isArray(result?.data) ? result.data : []); }
    catch (e) { setError(e.message || "Unable to load timetable"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load().catch(() => {}); const t = setInterval(() => load().catch(() => {}), 30000); window.addEventListener("focus", load); return () => { clearInterval(t); window.removeEventListener("focus", load); }; }, [load]);
  return <main className="space-y-6 p-6"><header className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live school data</p><h1 className="text-2xl font-black text-blue-950">{role === "admin" ? "Timetable Management" : "My Timetable"}</h1><p className="text-sm text-slate-500">Live timetable records from the school database.</p></div>{role === "admin" && <Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50">Back to SMIS</Link>}</header>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}{loading ? <div className="rounded-xl border bg-white p-6">Loading timetable…</div> : rows.length ? <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left"><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Time</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Room</th></tr></thead><tbody>{rows.map((x) => <tr key={x._id} className="border-b last:border-0"><td className="p-3">{DAYS[x.dayOfWeek] || "—"}</td><td className="p-3">{x.period ?? "—"}</td><td className="p-3">{x.startTime || "—"}–{x.endTime || "—"}</td><td className="p-3">{x.schoolClass?.name || "—"}{x.stream ? ` / ${x.stream}` : ""}</td><td className="p-3 font-semibold text-blue-950">{x.subject?.name || "—"}</td><td className="p-3">{teacherName(x.teacher)}</td><td className="p-3">{x.room || "—"}</td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">No timetable has been configured for this school yet.</div>}</main>;
}
