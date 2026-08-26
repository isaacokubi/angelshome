import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "../components/PortalShell";
import { apiRequest } from "../services/api";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function teacherName(teacher) {
  return teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "Teacher";
}

function localTime(value) {
  if (!value) return "—";
  return new Date(`1970-01-01T${value}:00`).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await apiRequest("/portal/teacher-workspace");
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load teacher workspace.");
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

  const stats = data?.stats || {};
  const attendance = data?.attendance || { summary: {}, totalMarked: 0, attendanceRate: null };
  const learning = Array.isArray(data?.learning) ? data.learning : [];
  const todayLessons = Array.isArray(data?.timetable) ? data.timetable : [];
  const pupils = Array.isArray(data?.pupils) ? data.pupils : [];
  const results = Array.isArray(data?.results) ? data.results : [];
  const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
  const upcoming = useMemo(() => learning.filter((record) => record.nextLesson && new Date(record.nextLesson) >= new Date()).sort((a, b) => new Date(a.nextLesson) - new Date(b.nextLesson)).slice(0, 5), [learning]);
  const averageProgress = stats.averageProgress == null ? null : Number(stats.averageProgress);

  return <PortalShell role="teacher">
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Angels Home Education Centre</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Teacher command centre</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">Your workspace is calculated from the classes, timetable allocations, pupils, learning records and attendance actually assigned to your teacher account.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => load(true)} disabled={loading} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15 disabled:opacity-60">{loading ? "Refreshing…" : "Refresh workspace"}</button>
            <Link to="/portal/teacher/classes" className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-blue-950 hover:bg-amber-300">My classes</Link>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold">
          <span className="rounded-full bg-emerald-400/15 px-3 py-2 text-emerald-200">● Live teacher data</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-blue-100">{stats.classes || 0} assigned classes</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-blue-100">{todayLessons.length} lessons today</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-blue-100">{stats.subjects || 0} subjects</span>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Pupils", stats.pupils || pupils.length, "Learners in your scheduled classes"],
          ["Classes", stats.classes || 0, "Classes assigned through timetable"],
          ["Subjects", stats.subjects || 0, "Subjects on your teaching load"],
          ["Progress", averageProgress == null ? "Not recorded" : `${averageProgress}%`, "Recorded learning progress"],
          ["Attendance", attendance.attendanceRate == null ? "Not recorded" : `${attendance.attendanceRate}%`, `${attendance.totalMarked || 0} records today"],
        ].map(([label, value, note]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-blue-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>)}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Digital Classroom", "Publish lessons, homework, assignments and exams.", "/portal/teacher/online-classroom", "Open classroom"],
          ["My Classes", "Open the pupils and learning records for your classes.", "/portal/teacher/classes", "Open classes"],
          ["Attendance", "Mark and review attendance for your assigned classes.", "/portal/teacher/attendance", "Open register"],
          ["Library", "Find and borrow school learning resources.", "/portal/teacher/library", "Open library"],
        ].map(([title, description, href, action]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-amber-600">Teacher tools</p><h2 className="mt-2 text-lg font-black text-blue-950">{title}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{description}</p><Link to={href} className="mt-4 inline-flex rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white">{action} →</Link></article>)}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Today's teaching load</p><h2 className="mt-1 text-xl font-black text-blue-950">{DAYS[data?.timetable?.[0]?.dayOfWeek] || "Today's"} lessons</h2><p className="mt-1 text-sm text-slate-500">Only lessons where this teacher is the assigned teacher are shown.</p></div><Link to="/portal/timetable" className="text-sm font-bold text-blue-700">View full timetable</Link></div>
        {todayLessons.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{todayLessons.map((lesson) => <article key={lesson._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-blue-950 px-2.5 py-1 text-xs font-black text-white">Period {lesson.period}</span><span className="text-xs font-bold text-slate-500">{localTime(lesson.startTime)}–{localTime(lesson.endTime)}</span></div><h3 className="mt-3 font-black text-blue-950">{lesson.schoolClass?.name || "Class"}{lesson.stream ? ` / ${lesson.stream}` : ""}</h3><p className="mt-1 text-sm font-semibold text-slate-700">{lesson.subject?.name || "Subject"}{lesson.subject?.code ? ` (${lesson.subject.code})` : ""}</p><p className="mt-2 text-xs font-semibold text-slate-500">{teacherName(lesson.teacher)} · {lesson.room || "Room —"}</p></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No lessons are assigned to your account for today.</div>}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Learning records</p><h2 className="mt-1 text-xl font-black text-blue-950">Assigned pupils and progress</h2></div><Link to="/portal/teacher/classes" className="text-sm font-bold text-blue-700">View all</Link></div>{learning.length ? <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Pupil</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Progress</th><th className="px-3 py-3">Next lesson</th></tr></thead><tbody>{learning.slice(0, 10).map((record) => <tr key={record._id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3 font-bold text-blue-950">{record.pupil?.name || "Pupil"}</td><td className="px-3 py-3 text-slate-700">{record.subject || "Subject"}</td><td className="px-3 py-3">{record.progress == null ? "Not recorded" : `${record.progress}%`}</td><td className="px-3 py-3 text-slate-500">{record.nextLesson ? new Date(record.nextLesson).toLocaleString() : "Not scheduled"}</td></tr>)}</tbody></table></div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No learning records are linked to this teacher account yet.</div>}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-amber-600">Next up</p><h2 className="mt-1 text-xl font-black text-blue-950">Upcoming lessons</h2><div className="mt-5 space-y-3">{upcoming.length ? upcoming.map((record) => <div key={record._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-blue-950">{record.subject || "Lesson"}</p><p className="mt-1 text-xs font-semibold text-slate-500">{record.pupil?.name || "Assigned pupil"}</p><p className="mt-2 text-xs text-slate-600">{new Date(record.nextLesson).toLocaleString()}</p></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No upcoming learning records are scheduled.</div>}</div></section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Class register</p><h2 className="mt-1 text-xl font-black text-blue-950">Attendance today</h2></div><Link to="/portal/teacher/attendance" className="text-sm font-bold text-blue-700">Open attendance</Link></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Present",attendance.summary?.present||0],["Late",attendance.summary?.late||0],["Absent",attendance.summary?.absent||0],["Sick",attendance.summary?.sick||0]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-blue-950">{value}</p></div>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Assessment activity</p><h2 className="mt-1 text-xl font-black text-blue-950">Recent results entered by you</h2></div><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{results.length ? results.map((item)=><div key={item._id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">{item.pupil?.name||"Pupil"} · {item.subject?.name||"Subject"}</p><p className="mt-1 text-xs text-slate-500">{item.exam?.name||"Examination"}</p></div><div className="text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">{item.grade||"—"}</p></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No results have been entered by you yet.</div>}</div></section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">School communications</p><h2 className="mt-1 text-xl font-black text-blue-950">Recent notifications</h2></div><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{notifications.length ? notifications.map((item)=><article key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></article>) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 md:col-span-2">No notifications have been published for your teacher account.</div>}</div></section>
    </div>
  </PortalShell>;
}
