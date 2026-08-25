import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { smisApi } from "../services/api";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

function teacherName(teacher) {
  return teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "—";
}

function className(schoolClass) {
  if (!schoolClass) return "—";
  return `${schoolClass.name || "—"}${schoolClass.stream ? ` / ${schoolClass.stream}` : ""}`;
}

function TimetableTable({ rows, showClass }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <th className="p-3">Period</th>
            <th className="p-3">Time</th>
            {showClass && <th className="p-3">Class</th>}
            <th className="p-3">Subject</th>
            <th className="p-3">Teacher</th>
            <th className="p-3">Room</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-b last:border-0 hover:bg-slate-50">
              <td className="p-3 font-semibold">{row.period ?? "—"}</td>
              <td className="whitespace-nowrap p-3 text-slate-600">{row.startTime || "—"}–{row.endTime || "—"}</td>
              {showClass && <td className="p-3 font-bold text-blue-950">{className(row.schoolClass)}</td>}
              <td className="p-3 font-semibold text-blue-950">{row.subject?.name || "—"}{row.subject?.code ? <span className="ml-2 text-xs font-medium text-slate-400">{row.subject.code}</span> : null}</td>
              <td className="p-3">{teacherName(row.teacher)}</td>
              <td className="p-3 text-slate-500">{row.room || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function groupByClass(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.schoolClass?._id || "unknown";
    if (!groups.has(key)) groups.set(key, { label: className(row.schoolClass), rows: [] });
    groups.get(key).rows.push(row);
  });
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export default function SMISTimetable({ role = "pupil" }) {
  const [rows, setRows] = useState([]);
  const [scope, setScope] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const result = await smisApi.timetable();
      setRows(Array.isArray(result?.data) ? result.data : []);
      setScope(result?.scope || "");
    } catch (e) {
      setError(e.message || "Unable to load timetable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
    const timer = setInterval(() => load().catch(() => {}), 30000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  const classGroups = useMemo(() => groupByClass(rows), [rows]);
  const title = role === "admin" ? "Whole School Timetable" : role === "parent" ? "My Children's Timetables" : "My Class Timetable";
  const description = role === "admin"
    ? "Complete school timetable showing every class, lesson, subject, time and teacher in one view."
    : role === "parent"
      ? "Only the timetables for your linked children's classes are shown. Other classes are not visible."
      : "Only the timetable for your assigned class or classes is shown. Other school classes are not visible.";

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live school data</p>
          <h1 className="text-2xl font-black text-blue-950">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
        </div>
        {role === "admin" && <Link to="/admin/smis/timetable" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50">Manage timetable</Link>}
      </header>

      {scope && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
          {scope === "school" ? "Administrator view: all active school timetable records." : "Restricted portal view: only timetable records belonging to your assigned class scope are returned by the server."}
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-xl border bg-white p-6">Loading timetable…</div>
      ) : !rows.length ? (
        <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No timetable has been configured for this class or school yet.</div>
      ) : role === "admin" ? (
        <div className="space-y-6">
          {SCHOOL_DAYS.map((day) => {
            const dayRows = rows.filter((row) => Number(row.dayOfWeek) === day);
            return (
              <section key={day} className="space-y-2">
                <div className="flex items-center justify-between"><h2 className="text-lg font-black text-blue-950">{DAYS[day]}</h2><span className="text-xs font-bold text-slate-400">{dayRows.length} lessons</span></div>
                {dayRows.length ? <TimetableTable rows={dayRows} showClass /> : <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-slate-400">No lessons scheduled.</div>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {classGroups.map((group) => (
            <section key={group.label} className="space-y-4">
              <div><h2 className="text-xl font-black text-blue-950">{group.label}</h2><p className="text-sm text-slate-500">Class timetable</p></div>
              {SCHOOL_DAYS.map((day) => {
                const dayRows = group.rows.filter((row) => Number(row.dayOfWeek) === day);
                return dayRows.length ? <section key={day} className="space-y-2"><h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{DAYS[day]}</h3><TimetableTable rows={dayRows} showClass={false} /></section> : null;
              })}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
