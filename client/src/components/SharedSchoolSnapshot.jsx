import { Link } from "react-router-dom";

const roleActions = {
  admin: [["Manage pupils", "/portal/admin/pupils"], ["Manage teachers", "/portal/admin/teachers"], ["Manage parents", "/portal/admin/parents"], ["Manage sponsors", "/portal/admin/sponsors"], ["Timetable", "/admin/smis/timetable"]],
  teacher: [["My classes", "/portal/teacher/classes"], ["My timetable", "/admin/smis/timetable"], ["School notifications", "/portal/notifications"]],
  pupil: [["My learning", "/portal/pupil/learning"], ["My timetable", "/admin/smis/timetable"], ["School notifications", "/portal/notifications"]],
  parent: [["School updates", "/portal/notifications"], ["My children", "/portal/parent#children"], ["School timetable", "/admin/smis/timetable"]],
  sponsor: [["My impact", "/portal/sponsor/impact"], ["School timetable", "/admin/smis/timetable"], ["School notifications", "/portal/notifications"]],
};

export default function SharedSchoolSnapshot({ data, role }) {
  const stats = Array.isArray(data?.stats) ? data.stats : [];
  const actions = roleActions[role] || roleActions.pupil;
  return <>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live school snapshot</p><h3 className="mt-1 text-xl font-black text-blue-950">School operations</h3><p className="mt-1 text-sm text-slate-500">These figures come from the same school database used by the administration.</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Live data</span></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-black text-blue-950">{stat.value ?? "—"}</p>{stat.note && <p className="mt-1 text-xs text-slate-500">{stat.note}</p>}</div>)}</div>
    </section>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{actions.map(([label, href]) => <Link key={href} to={href} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50">{label}<span className="ml-2">→</span></Link>)}</section>
  </>;
}
