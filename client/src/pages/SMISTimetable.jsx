import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authApi, smisApi } from "../services/api";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SCHOOL_DAYS = [1, 2, 3, 4, 5];
const PERIOD_COUNT = 8;

const teacherName = (teacher) => teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "—";
const className = (schoolClass) => !schoolClass ? "—" : `${schoolClass.name || "—"}${schoolClass.stream ? ` / ${schoolClass.stream}` : ""}`;

function normaliseTime(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return raw || "—";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return raw || "—";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function sortLessons(rows) {
  return rows.slice().sort((a, b) => {
    const classCompare = className(a.schoolClass).localeCompare(className(b.schoolClass), undefined, { numeric: true });
    if (classCompare) return classCompare;
    return String(a.subject?.name || "").localeCompare(String(b.subject?.name || ""));
  });
}

function periodTime(rows) {
  const first = rows.find((row) => row.startTime || row.endTime);
  if (!first) return "School period";
  return `${normaliseTime(first.startTime)}–${normaliseTime(first.endTime)}`;
}

function LessonCard({ row, showClass }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      {showClass && <p className="font-black text-blue-950">{className(row.schoolClass)}</p>}
      <p className={`${showClass ? "mt-1" : ""} font-semibold text-blue-950`}>
        {row.subject?.name || "Subject"}
        {row.subject?.code ? <span className="ml-2 text-xs font-medium text-slate-400">({row.subject.code})</span> : null}
      </p>
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg bg-white px-2.5 py-2">
          <span className="font-bold uppercase tracking-wide text-slate-400">Teacher</span>
          <p className="mt-0.5 font-semibold text-slate-700">{teacherName(row.teacher)}</p>
        </div>
        <div className="rounded-lg bg-white px-2.5 py-2">
          <span className="font-bold uppercase tracking-wide text-slate-400">Room</span>
          <p className="mt-0.5 font-semibold text-slate-700">{row.room || "—"}</p>
        </div>
      </div>
    </article>
  );
}

function TimetableTable({ rows, showClass }) {
  const grouped = useMemo(() => {
    const byPeriod = new Map();
    rows.forEach((row) => {
      const period = Number(row.period);
      if (!Number.isInteger(period) || period < 1 || period > PERIOD_COUNT) return;
      if (!byPeriod.has(period)) byPeriod.set(period, []);
      byPeriod.get(period).push(row);
    });

    return Array.from({ length: PERIOD_COUNT }, (_, index) => {
      const period = index + 1;
      return { period, items: sortLessons(byPeriod.get(period) || []) };
    });
  }, [rows]);

  return (
    <div className="space-y-3">
      {grouped.map(({ period, items }) => {
        const time = periodTime(items);
        return (
          <section key={`period-${period}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-950 px-3 py-1.5 text-sm font-black text-white">Period {period}</span>
                <span className="font-semibold text-slate-600">{time}</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{items.length} lesson{items.length === 1 ? "" : "s"}</span>
            </div>

            {items.length ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((row) => <LessonCard key={row._id} row={row} showClass={showClass} />)}
              </div>
            ) : (
              <div className="p-5 text-sm font-medium text-slate-400">Free / not scheduled</div>
            )}
          </section>
        );
      })}
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
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export default function SMISTimetable({ role = null }) {
  const [viewerRole, setViewerRole] = useState(role);
  const [rows, setRows] = useState([]);
  const [scope, setScope] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role) return undefined;
    let active = true;
    authApi.me()
      .then((result) => {
        if (active) setViewerRole(result?.user?.role || "pupil");
      })
      .catch(() => {
        if (active) setViewerRole("pupil");
      });
    return () => { active = false; };
  }, [role]);

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
    void load();
    const timer = setInterval(() => void load(), 30000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  const classGroups = useMemo(() => groupByClass(rows), [rows]);
  const isAdmin = viewerRole === "admin";
  const isTeacher = viewerRole === "teacher";
  const isParent = viewerRole === "parent";
  const title = isAdmin ? "Whole School Timetable" : isTeacher ? "My Teacher Timetable" : isParent ? "My Children's Timetables" : "My Class Timetable";
  const description = isAdmin
    ? "Complete master timetable showing all eight school periods for every weekday, with every scheduled class, subject, teacher and room."
    : isTeacher
      ? "Your timetable is grouped into eight daily school periods and only includes lessons assigned to your teacher account."
      : isParent
        ? "Your linked pupils' class timetables are shown in the same eight-period daily structure."
        : "Your class timetable is shown in the same eight-period daily structure.";

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live school data</p>
          <h1 className="text-2xl font-black text-blue-950">{title}</h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-500">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">Monday–Friday</span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">8 periods per day</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Based on active class + subject allocations</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} disabled={!rows.length} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold disabled:opacity-50">Print / Extract</button>
          {isAdmin && <Link to="/admin/smis/timetable" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50">Manage timetable</Link>}
        </div>
      </header>

      {scope && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{scope === "school" ? "Administrator view: all active school timetable records." : scope === "teacher" ? "Teacher view: server-enforced lesson-level scope for this teacher." : "Portal view: server-enforced class scope for your linked pupil/class."}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-xl border bg-white p-6">Loading timetable…</div>
      ) : !rows.length ? (
        <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No timetable has been configured for your permitted scope yet.</div>
      ) : isAdmin ? (
        <div className="space-y-6">
          {SCHOOL_DAYS.map((day) => {
            const dayRows = rows.filter((row) => Number(row.dayOfWeek) === day);
            return (
              <section key={day} className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="text-lg font-black text-blue-950">{DAYS[day]}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">8 periods · {dayRows.length} scheduled lessons</span>
                </div>
                <TimetableTable rows={dayRows} showClass />
              </section>
            );
          })}
        </div>
      ) : isTeacher ? (
        <div className="space-y-6">
          {SCHOOL_DAYS.map((day) => {
            const dayRows = rows.filter((row) => Number(row.dayOfWeek) === day);
            return (
              <section key={day} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-blue-950">{DAYS[day]}</h2>
                  <span className="text-xs font-bold text-slate-400">8 periods · {dayRows.length} assigned lessons</span>
                </div>
                <TimetableTable rows={dayRows} showClass />
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {classGroups.map((group) => (
            <section key={group.label} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-blue-950">{group.label}</h2>
                <p className="text-sm text-slate-500">Class timetable · 8 periods per weekday</p>
              </div>
              {SCHOOL_DAYS.map((day) => {
                const dayRows = group.rows.filter((row) => Number(row.dayOfWeek) === day);
                return (
                  <section key={day} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{DAYS[day]}</h3>
                      <span className="text-xs font-bold text-slate-400">8 periods · {dayRows.length} lessons</span>
                    </div>
                    <TimetableTable rows={dayRows} showClass={false} />
                  </section>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
