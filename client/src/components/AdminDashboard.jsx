import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const value = (value, empty = "—") => value === null || value === undefined ? empty : value;

export default function AdminDashboard({ data }) {
  const school = data?.school || {};
  const attendance = school.attendanceToday || {};
  const recentResults = data?.results?.recent || [];
  const [unlinkedPupils, setUnlinkedPupils] = useState([]);
  const [unlinkedLoading, setUnlinkedLoading] = useState(true);
  const [unlinkedError, setUnlinkedError] = useState("");

  useEffect(() => {
    let active = true;
    setUnlinkedLoading(true);
    apiRequest("/admin-audit/unlinked-pupils")
      .then((result) => {
        if (!active) return;
        setUnlinkedPupils(result.pupils || []);
        setUnlinkedError("");
      })
      .catch((error) => {
        if (active) setUnlinkedError(error.message || "Unable to load unlinked pupil accounts.");
      })
      .finally(() => {
        if (active) setUnlinkedLoading(false);
      });
    return () => { active = false; };
  }, []);

  const cards = [
    ["Pupils", school.pupils], ["Teachers", school.teachers], ["Parents", school.parents], ["Sponsors", school.sponsors],
    ["Classes", school.classes], ["Subjects", school.subjects], ["Open exams", school.openExams], ["Results today", school.resultsEnteredToday],
  ];
  const links = [["Pupils", "/portal/admin/pupils"], ["Teachers", "/portal/admin/teachers"], ["Parents", "/portal/admin/parents"], ["Sponsors", "/portal/admin/sponsors"], ["SMIS Operations", "/admin/smis"], ["Attendance", "/admin/smis/attendance"], ["Exams & Results", "/admin/smis/results"]];
  return <>
    <div className="mb-8 rounded-3xl bg-blue-950 p-8 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-300">School administration</p>
      <h2 className="mt-2 text-3xl font-black">Welcome back, {data?.profile?.name || "Administrator"}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">This dashboard is a live view of the same school records used by the administration, academic and portal modules.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link to="/admin/smis" className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950">Open SMIS Centre</Link><Link to="/admin/smis/attendance" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold">Take attendance</Link><Link to="/admin/smis/results" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold">Enter results</Link></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, item]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-blue-950">{value(item)}</p><p className="mt-2 text-xs text-slate-500">Live school database</p></div>)}</div>

    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Account audit</p>{!unlinkedLoading && <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-900">{unlinkedPupils.length} unlinked</span>}</div>
          <h3 className="mt-1 text-xl font-black text-blue-950">Pupils without a parent account</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">These active pupil accounts are not currently linked through a parent account. Review them to identify incorrect registrations or accounts that need a parent relationship.</p>
        </div>
        <Link to="/portal/admin/relationships" className="shrink-0 rounded-xl bg-blue-950 px-4 py-3 text-center text-sm font-bold text-white">Manage relationships →</Link>
      </div>
      {unlinkedError ? <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm font-semibold text-red-700">{unlinkedError}</div> : unlinkedLoading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white" />)}</div> : unlinkedPupils.length ? <div className="mt-5 overflow-x-auto rounded-xl border border-amber-200 bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Pupil</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Parent contact</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{unlinkedPupils.map((pupil) => <tr key={pupil._id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-blue-950">{pupil.name}</td><td className="px-4 py-4 text-slate-600">{pupil.email || "Not provided"}</td><td className="px-4 py-4 text-slate-600">{pupil.phone || "Not provided"}</td><td className="px-4 py-4 text-slate-600">{pupil.parentPhone || "Not provided"}</td><td className="px-4 py-4"><Link to="/portal/admin/relationships" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900">Link parent</Link></td></tr>)}</tbody></table></div> : <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-6 text-center"><p className="font-black text-emerald-700">✓ All active pupil accounts are linked to a parent account.</p><p className="mt-1 text-sm text-slate-500">No unlinked pupil accounts were found.</p></div>}
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Today</p><h3 className="mt-1 text-xl font-black text-blue-950">Attendance overview</h3></div><Link to="/admin/smis/attendance" className="text-sm font-bold text-blue-700">Open register →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-4">{[["Present", attendance.present || 0], ["Absent", attendance.absent || 0], ["Sick", attendance.sick || 0], ["Late", attendance.late || 0]].map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-blue-950">{count}</p></div>)}</div><p className="mt-4 text-sm text-slate-500">{attendance.totalMarked ? `${attendance.attendanceRate}% present among ${attendance.totalMarked} attendance records marked today.` : "No attendance records have been marked today."}</p></div>
      <div className="rounded-2xl bg-amber-50 p-6"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Academic operations</p><p className="mt-3 text-3xl font-black text-blue-950">{value(school.openExams, 0)}</p><p className="mt-1 font-bold text-blue-950">Open examinations</p><p className="mt-4 text-sm text-slate-600">{value(school.resultsEnteredToday, 0)} results entered today.</p><Link to="/admin/smis/results" className="mt-5 inline-flex rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white">Manage results</Link></div>
    </section>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent examination results</h3><Link to="/portal/results" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{recentResults.length ? recentResults.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-blue-950">{item.pupil?.name || "Pupil"}</p><p className="mt-1 text-xs text-slate-500">{item.subject?.name || "Subject"} · {item.exam?.name || "Examination"}</p></div><div className="text-right"><p className="font-black text-blue-950">{item.marks}/{item.maxMarks}</p><p className="text-xs font-bold text-amber-700">Grade {item.grade || "—"}</p></div></div></div>) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500 md:col-span-2">No examination results have been recorded yet.</div>}</div></section>
    <section className="mt-8"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">School operations</p><h3 className="mt-1 text-2xl font-black text-blue-950">Administration centre</h3><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{links.map(([label, to]) => <Link key={to} to={to} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md"><p className="font-black text-blue-950">{label}</p><p className="mt-3 text-sm font-bold text-blue-700">Open →</p></Link>)}</div></section>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{data?.notifications?.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>) : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No recent school activity.</p>}</div></section>
  </>;
}
