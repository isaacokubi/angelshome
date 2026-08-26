import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { smisApi } from "../services/api";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PERIODS = Array.from({ length: 8 }, (_, index) => index + 1);

function teacherName(teacher) {
  return teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "—";
}

function dayNumber(date = new Date()) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
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

  const currentDay = dayNumber();
  const grouped = useMemo(() => {
    const dayRows = rows.filter((row) => Number(row.dayOfWeek) === currentDay);
    const map = new Map(PERIODS.map((period) => [period, []]));
    dayRows.forEach((row) => {
      const period = Number(row.period);
      if (map.has(period)) map.get(period).push(row);
    });
    return [...map.entries()].map(([period, lessons]) => [period, lessons.sort((a, b) => String(a.schoolClass?.name || "").localeCompare(String(b.schoolClass?.name || "")))]);
  }, [rows, currentDay]);
  const hasLessons = grouped.some(([, lessons]) => lessons.length);
  const timetableLink = role === "admin" ? "/admin/smis/timetable" : "/portal/timetable";

  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live timetable</p><h3 className="mt-1 text-xl font-black text-blue-950">{DAYS[currentDay] || "Today"} school timetable</h3><p className="mt-1 text-sm text-slate-500">Live eight-period schedule for today, shared from the school database.</p></div>
      <Link to={timetableLink} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50">{role === "admin" ? "Manage timetable" : "View full timetable"} →</Link>
    </div>
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    {loading && !rows.length && !error ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-xl bg-slate-100" /><div className="h-20 animate-pulse rounded-xl bg-slate-100" /></div> : hasLessons ? <div className="mt-5 space-y-3">{grouped.map(([period, lessons]) => <div key={period} className="overflow-hidden rounded-2xl border border-slate-200"><div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Period {period}</p><p className="text-sm font-bold text-blue-950">{lessons[0]?.startTime || "—"}–{lessons[0]?.endTime || "—"}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</span></div><div className="divide-y divide-slate-100">{lessons.map((row) => <div key={row._id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1.2fr_1.4fr_1fr_0.8fr]"><div className="font-bold text-blue-950">{row.schoolClass?.name || "Class"}{row.stream ? ` / ${row.stream}` : ""}</div><div className="font-semibold text-slate-700">{row.subject?.name || "Subject"}{row.subject?.code ? ` (${row.subject.code})` : ""}</div><div className="text-slate-600">{teacherName(row.teacher)}</div><div className="text-slate-500">{row.room || "Room —"}</div></div>)}</div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No lessons are scheduled for {DAYS[currentDay] || "today"}.</div>}
  </section>;
}
