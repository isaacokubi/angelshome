import { Link } from "react-router-dom";

const value = (value, empty = "—") => value === null || value === undefined ? empty : value;

export default function AdminDashboard({ data }) {
  const school = data?.school || {};
  const attendance = school.attendanceToday || {};
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
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Today</p><h3 className="mt-1 text-xl font-black text-blue-950">Attendance overview</h3></div><Link to="/admin/smis/attendance" className="text-sm font-bold text-blue-700">Open register →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-4">{[["Present", attendance.present || 0], ["Absent", attendance.absent || 0], ["Sick", attendance.sick || 0], ["Late", attendance.late || 0]].map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-blue-950">{count}</p></div>)}</div><p className="mt-4 text-sm text-slate-500">{attendance.totalMarked ? `${attendance.attendanceRate}% present among ${attendance.totalMarked} attendance records marked today.` : "No attendance records have been marked today."}</p></div>
      <div className="rounded-2xl bg-amber-50 p-6"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Academic operations</p><p className="mt-3 text-3xl font-black text-blue-950">{value(school.openExams, 0)}</p><p className="mt-1 font-bold text-blue-950">Open examinations</p><p className="mt-4 text-sm text-slate-600">{value(school.resultsEnteredToday, 0)} results entered today.</p><Link to="/admin/smis/results" className="mt-5 inline-flex rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white">Manage results</Link></div>
    </section>
    <section className="mt-8"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">School operations</p><h3 className="mt-1 text-2xl font-black text-blue-950">Administration centre</h3><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{links.map(([label, to]) => <Link key={to} to={to} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md"><p className="font-black text-blue-950">{label}</p><p className="mt-3 text-sm font-bold text-blue-700">Open →</p></Link>)}</div></section>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-3">{data?.notifications?.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>) : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No recent school activity.</p>}</div></section>
  </>;
}
