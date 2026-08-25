import { Link } from "react-router-dom";
import SharedSchoolSnapshot from "./SharedSchoolSnapshot";
import TimetablePanel from "./TimetablePanel";

function percentage(value) {
  return value == null || !Number.isFinite(Number(value)) ? null : Math.round(Number(value));
}

function statusFor(value) {
  if (value == null) return { label: "Awaiting data", className: "bg-slate-100 text-slate-600" };
  if (value >= 80) return { label: "Strong", className: "bg-emerald-50 text-emerald-700" };
  if (value >= 60) return { label: "On track", className: "bg-amber-50 text-amber-700" };
  return { label: "Needs attention", className: "bg-red-50 text-red-700" };
}

export default function SponsorDashboard({ data }) {
  const pupils = Array.isArray(data?.sponsoredPupils) ? data.sponsoredPupils : [];
  const results = data?.results || {};
  const average = percentage(results.average);
  const strongPupils = pupils.filter((pupil) => percentage(pupil.learning?.averageProgress) >= 80).length;
  const attendanceTracked = pupils.filter((pupil) => pupil.academic?.attendanceRate != null).length;
  const recentResults = Array.isArray(results.recent) ? results.recent : [];

  return <>
    <div id="impact" className="mb-8 scroll-mt-28">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div><p className="text-sm font-bold uppercase tracking-widest text-amber-600">Sponsor impact centre</p><h2 className="mt-1 text-3xl font-black text-blue-950 md:text-4xl">Support that stays measurable</h2><p className="mt-3 max-w-3xl text-slate-600">Follow the academic progress, attendance and school activity of pupils linked to your sponsorship from one secure workspace.</p></div>
        <div className="flex flex-wrap gap-3"><Link to="/portal/results" className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-900">Review results</Link><Link to="/portal/notifications" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-blue-950 hover:bg-blue-50">School updates</Link></div>
      </div>
    </div>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Sponsored pupils" value={pupils.length} note={pupils.length ? "Active school linkage" : "Awaiting school linkage"} />
      <Metric label="Academic average" value={average == null ? "—" : `${average}%`} note={average == null ? "Awaiting assessment data" : "Across available results"} />
      <Metric label="Progress on track" value={pupils.length ? `${strongPupils}/${pupils.length}` : "—"} note={pupils.length ? "Pupils at 80%+ progress" : "No linked pupils"} />
      <Metric label="Attendance tracked" value={pupils.length ? `${attendanceTracked}/${pupils.length}` : "—"} note="Pupils with attendance data" />
    </section>

    <section id="sponsored-pupils" className="mt-8 scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Portfolio</p><h3 className="mt-1 text-xl font-black text-blue-950">Sponsored pupils</h3><p className="mt-1 text-sm text-slate-500">A school-record view of the pupils connected to your sponsorship.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{pupils.length} linked</span></div>
      {pupils.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pupils.map((pupil) => { const progress = percentage(pupil.learning?.averageProgress); const attendance = percentage(pupil.academic?.attendanceRate); const status = statusFor(progress ?? attendance); return <article key={pupil._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="text-lg font-black text-blue-950">{pupil.name}</h4><p className="mt-1 text-sm text-slate-500">{pupil.email || "Pupil account"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Attendance</p><p className="mt-1 font-black text-blue-950">{attendance == null ? "Not recorded" : `${attendance}%`}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Subjects</p><p className="mt-1 font-black text-blue-950">{pupil.learning?.subjects ?? 0}</p></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Learning progress</span><span>{progress == null ? "Not recorded" : `${progress}%`}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }} /></div></div><div className="mt-5 flex flex-wrap gap-2"><Link to="/portal/results" className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900">View results</Link><Link to="/portal/sponsor/attendance" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-950 hover:bg-blue-50">Attendance</Link></div></article>; })}</div> : <Empty title="No sponsored pupils yet" text="Once the school links pupils to your sponsor account, their progress and academic information will appear here." />}
    </section>

    <SharedSchoolSnapshot data={data} role="sponsor" />
    <TimetablePanel role="sponsor" />

    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Academic monitoring</p><h3 className="mt-1 text-lg font-black text-blue-950">Recent results</h3></div><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{recentResults.length ? recentResults.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">{item.pupil?.name || "Pupil"} · {item.subject?.name || "Subject"}</p><p className="mt-1 text-xs text-slate-500">{item.exam?.name || "Examination"}</p></div><div className="text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">{item.grade || "—"}</p></div></div>) : <Empty title="No results yet" text="Published examination results for your sponsored pupils will appear here." />}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Sponsor actions</p><h3 className="mt-1 text-lg font-black text-blue-950">Stay connected</h3><div className="mt-5 space-y-3"><Action href="/portal/sponsor/impact" title="Impact report" text="Review your sponsorship impact." /><Action href="/portal/sponsor/attendance" title="Attendance" text="Monitor available attendance records." /><Action href="/portal/notifications" title="School updates" text="Keep up with school communications." /><Action href="/portal/timetable" title="School timetable" text="See the current school schedule." /></div></section>
    </div>
  </>;
}

function Metric({ label, value, note }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-blue-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>; }
function Empty({ title, text }) { return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><p className="font-bold text-slate-700">{title}</p><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>; }
function Action({ href, title, text }) { return <Link to={href} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"><p className="font-bold text-blue-950">{title} <span className="float-right">→</span></p><p className="mt-1 text-xs text-slate-500">{text}</p></Link>; }
