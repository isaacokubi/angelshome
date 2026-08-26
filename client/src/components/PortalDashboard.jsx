import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "./PortalShell";
import AdminDashboard from "./AdminDashboard";
import SponsorDashboard from "./SponsorDashboard";
import SharedSchoolSnapshot from "./SharedSchoolSnapshot";
import TimetablePanel from "./TimetablePanel";
import UnlinkedPupilsAudit from "./UnlinkedPupilsAudit";
import { portalApi } from "../services/api";

export default function PortalDashboard() {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    return Promise.all([portalApi.dashboard(), portalApi.metrics()])
      .then(([result, metricResult]) => {
        setData(result);
        setMetrics(metricResult);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    load(true).catch(() => {});
    const refresh = () => { if (active) load(false).catch(() => {}); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  const role = data?.profile?.role || "pupil";

  return (
    <PortalShell role={role}>
      {loading && !data && (
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => <div key={n} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        </div>
      )}
      {error && !data && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
          <p>{error}</p>
          <button type="button" onClick={() => load(true)} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-white">Try again</button>
        </div>
      )}
      {data && role === "admin" && <><AdminDashboard data={data} /><UnlinkedPupilsAudit /><TimetablePanel role={role} /></>}
      {data && role === "sponsor" && <SponsorDashboard data={data} />}
      {data && role === "teacher" && <TeacherDashboard data={data} loading={loading} onRefresh={() => load(true)} />}
      {data && !["admin", "sponsor", "teacher"].includes(role) && <StandardDashboard data={data} role={role} metrics={metrics} />}
    </PortalShell>
  );
}

function TeacherDashboard({ data, loading, onRefresh }) {
  const learning = Array.isArray(data?.learning) ? data.learning : [];
  const pupils = Array.isArray(data?.pupils) ? data.pupils : [];
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
  const attendance = data?.attendance || {};
  const recentResults = data?.results?.recent || [];

  const progressValues = learning
    .map((record) => Number(record.progress))
    .filter((value) => Number.isFinite(value));
  const averageProgress = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
    : null;

  const upcomingLessons = useMemo(() => learning
    .filter((record) => record.nextLesson && !Number.isNaN(new Date(record.nextLesson).getTime()) && new Date(record.nextLesson) >= new Date())
    .sort((a, b) => new Date(a.nextLesson) - new Date(b.nextLesson))
    .slice(0, 4), [learning]);

  const totalAttendance = Object.values(attendance.summary || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const attendanceRate = totalAttendance
    ? Math.round(((Number(attendance.summary?.present || 0) + Number(attendance.summary?.late || 0)) / totalAttendance) * 100)
    : null;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Angels Home Education Centre</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">Teacher command centre</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">A focused workspace for your assigned learning records, pupil progress, attendance, assessments and the school timetable.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onRefresh} disabled={loading} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15 disabled:opacity-60">{loading ? "Refreshing…" : "Refresh workspace"}</button>
            <Link to="/portal/teacher/classes" className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-blue-950 hover:bg-amber-300">Open my classes</Link>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="rounded-full bg-emerald-400/15 px-3 py-2 text-emerald-200">● Live school data</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-blue-100">{pupils.length} assigned pupils in learning records</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-blue-100">{subjects.length} active subjects</span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Teacher workspace summary">
        {[
          ["Pupils", pupils.length, "Assigned learning records"],
          ["Subjects", subjects.length, "Subjects with learning records"],
          ["Progress", averageProgress == null ? "Not recorded" : `${averageProgress}%`, progressValues.length ? "Average recorded progress" : "Awaiting learning data"],
          ["Attendance", attendanceRate == null ? "Not recorded" : `${attendanceRate}%`, totalAttendance ? `${totalAttendance} attendance records` : "Awaiting class register data"],
        ].map(([label, value, note]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-blue-950">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Teacher quick actions">
        {[
          ["My Classes", "Review assigned pupils and learning records.", "/portal/teacher/classes", "Open workspace"],
          ["Attendance", "Review attendance for your assigned classes.", "/portal/teacher/attendance", "View register"],
          ["Results", "Review assessment records across the school.", "/portal/results", "View results"],
          ["Timetable", "Check lessons and current school scheduling.", "/portal/timetable", "View timetable"],
        ].map(([title, description, href, action]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Teacher tools</p>
            <h3 className="mt-2 text-lg font-black text-blue-950">{title}</h3>
            <p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{description}</p>
            <Link to={href} className="mt-4 inline-flex rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900">{action} →</Link>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Teaching workload</p><h3 className="mt-1 text-xl font-black text-blue-950">Assigned learning records</h3><p className="mt-1 text-sm text-slate-500">Subjects and pupils currently associated with your teacher account.</p></div><Link to="/portal/teacher/classes" className="text-sm font-bold text-blue-700">View all</Link></div>
          {loading ? <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Loading teaching records…</div> : learning.length ? (
            <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Pupil</th><th className="px-3 py-3">Progress</th><th className="px-3 py-3">Next lesson</th></tr></thead><tbody>{learning.slice(0, 8).map((record) => <tr key={record._id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 font-bold text-blue-950">{record.subject || "Subject"}</td><td className="px-3 py-3 text-slate-700">{record.pupil?.name || "Pupil"}</td><td className="px-3 py-3">{record.progress == null ? <span className="text-slate-400">Not recorded</span> : <div className="min-w-28"><div className="flex justify-between text-xs font-bold"><span>{record.progress}%</span><span className="text-slate-400">progress</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${Math.min(100, Math.max(0, Number(record.progress) || 0))}%` }} /></div></div>}</td><td className="px-3 py-3 text-slate-500">{record.nextLesson ? new Date(record.nextLesson).toLocaleString() : "Not scheduled"}</td></tr>)}</tbody></table></div>
          ) : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No learning records are assigned to your account yet.</div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Next up</p><h3 className="mt-1 text-xl font-black text-blue-950">Upcoming lessons</h3></div><Link to="/portal/timetable" className="text-sm font-bold text-blue-700">Timetable</Link></div><div className="mt-5 space-y-3">{upcomingLessons.length ? upcomingLessons.map((record) => <div key={`${record._id}-lesson`} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-blue-950">{record.subject || "Lesson"}</p><p className="mt-1 text-xs font-semibold text-slate-500">{record.pupil?.name || "Assigned pupil"}</p><p className="mt-2 text-xs text-slate-600">{new Date(record.nextLesson).toLocaleString()}</p></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No upcoming lessons are recorded in your learning data.</div>}</div></section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Class register</p><h3 className="mt-1 text-xl font-black text-blue-950">Attendance overview</h3></div><Link to="/portal/teacher/attendance" className="text-sm font-bold text-blue-700">Open attendance</Link></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Present", attendance.summary?.present || 0], ["Late", attendance.summary?.late || 0], ["Absent", attendance.summary?.absent || 0], ["Sick", attendance.summary?.sick || 0]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-blue-950">{value}</p></div>)}</div><p className="mt-4 text-sm text-slate-500">Attendance is restricted by the school system to classes where you are assigned as class teacher.</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Assessment activity</p><h3 className="mt-1 text-xl font-black text-blue-950">Recent results</h3></div><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{recentResults.length ? recentResults.map((item) => <div key={item._id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div className="min-w-0"><p className="truncate font-bold text-slate-800">{item.subject?.name || "Subject"}</p><p className="mt-1 truncate text-xs text-slate-500">{item.pupil?.name || "Pupil"} · {item.exam?.name || "Examination"}</p></div><div className="shrink-0 text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">{item.grade || "—"}</p></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No examination results have been recorded yet.</div>}</div></section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">School communications</p><h3 className="mt-1 text-xl font-black text-blue-950">Recent notifications</h3><p className="mt-1 text-sm text-slate-500">Important school messages delivered to your teacher account.</p></div><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all notifications</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{data.notifications?.length ? data.notifications.slice(0, 4).map((item) => <article key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p></article>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2">No school activity has been published for your account.</div>}</div></section>
      <TimetablePanel role="teacher" />
    </div>
  );
}

function StandardDashboard({ data, role, metrics }) {
  if (role === "parent") return <ParentDashboard data={data} metrics={metrics} />;
  const recentResults = data?.results?.recent || [];
  return <>
    <div className="mb-8"><p className="text-sm font-bold text-amber-600">{data?.profile?.name ? `WELCOME BACK, ${data.profile.name.toUpperCase()}` : "SCHOOL PORTAL"}</p><h2 className="mt-1 text-3xl font-black text-blue-950">{role === "pupil" ? "My learning" : `${data?.profile?.roleLabel || "School"} dashboard`}</h2><p className="mt-2 max-w-2xl text-slate-600">Your portal information is loaded from the school database and reflects your current account.</p></div>
    <SharedSchoolSnapshot data={data} role={role} metrics={metrics} />
    <TimetablePanel role={role} />
    <div className="mt-8 grid gap-6 lg:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-blue-950">Recent examination results</h3><p className="mt-1 text-xs text-slate-500">Live from the school assessment records.</p></div><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{recentResults.length ? recentResults.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">{item.subject?.name || "Subject"}</p><p className="mt-1 text-xs text-slate-500">{item.exam?.name || "Examination"}{item.pupil?.name ? ` · ${item.pupil.name}` : ""}</p></div><div className="text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">{item.grade || "—"}</p></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No examination results have been recorded for this account yet.</div>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-4">{data.notifications?.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No school activity has been published for your account.</div>}</div></section></div>
  </>;
}

function ParentDashboard({ data, metrics }) {
  const children = Array.isArray(data?.children) ? data.children : [];
  const recentResults = data?.results?.recent || [];
  return <>
    <div className="mb-8"><p className="text-sm font-bold text-amber-600">{data?.profile?.name ? `WELCOME BACK, ${data.profile.name.toUpperCase()}` : "PARENT PORTAL"}</p><h2 className="mt-1 text-3xl font-black text-blue-950">Parent dashboard</h2><p className="mt-2 max-w-3xl text-slate-600">Keep track of your children, attendance, academic results and important school updates from one place.</p></div>
    <section id="children" className="mb-8 scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Family overview</p><h3 className="mt-1 text-xl font-black text-blue-950">My children</h3><p className="mt-1 text-sm text-slate-500">Children linked to your parent account by the school.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{children.length} linked {children.length === 1 ? "child" : "children"}</span></div>{children.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children.map((child) => { const progress = child.learning?.averageProgress; const attendance = child.academic?.attendanceRate; return <article key={child._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="text-lg font-black text-blue-950">{child.name}</h4><p className="mt-1 text-sm text-slate-500">{child.email || "Pupil account"}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">Pupil</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Attendance</p><p className="mt-1 font-black text-blue-950">{attendance == null ? "Not recorded" : `${attendance}%`}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Subjects</p><p className="mt-1 font-black text-blue-950">{child.learning?.subjects ?? 0}</p></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Learning progress</span><span>{progress == null ? "Not recorded" : `${Math.round(progress)}%`}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, Math.max(0, Number(progress) || 0))}%` }} /></div></div><div className="mt-5 flex flex-wrap gap-2"><Link to="/portal/results" className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900">View results</Link><Link to="/portal/parent/attendance" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-950 hover:bg-blue-50">View attendance</Link></div></article>; })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><p className="font-bold text-slate-700">No children are linked to this account yet.</p><p className="mt-2 text-sm leading-6 text-slate-500">Once the school links a pupil to your parent account, their academic information will appear here automatically.</p></div>}</section>
    <SharedSchoolSnapshot data={data} role="parent" metrics={metrics} /><TimetablePanel role="parent" />
    <div className="mt-8 grid gap-6 lg:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-blue-950">Recent examination results</h3><p className="mt-1 text-xs text-slate-500">Results for pupils linked to your parent account.</p></div><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{recentResults.length ? recentResults.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">{item.pupil?.name || "Pupil"} · {item.subject?.name || "Subject"}</p><p className="mt-1 text-xs text-slate-500">{item.exam?.name || "Examination"}</p></div><div className="text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">{item.grade || "—"}</p></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No examination results have been recorded for your linked children yet.</div>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-4">{data.notifications?.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No school activity has been published for your account.</div>}</div></section></div>
  </>;
}
