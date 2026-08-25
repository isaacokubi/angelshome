import { Link, useLocation, useNavigate } from "react-router-dom";

const roleLabels = { admin: "Administrator", teacher: "Teacher", pupil: "Pupil", sponsor: "Sponsor", parent: "Parent" };

export default function PortalShell({ role, children }) {
  const location = useLocation(); const navigate = useNavigate();
  const links = [
    ["Dashboard", `/portal/${role}`],
    ["Results", "/portal/results"],
    ...(role === "admin" ? [["Pupils", "/portal/admin/pupils"], ["Teachers", "/portal/admin/teachers"], ["Parents", "/portal/admin/parents"], ["Sponsors", "/portal/admin/sponsors"], ["Relationships", "/portal/admin/relationships"], ["Attendance", "/portal/admin/attendance"], ["Timetable", "/admin/smis/timetable"]] : []),
    ...(role === "teacher" ? [["My Classes", "/portal/teacher/classes"], ["Attendance", "/portal/teacher/attendance"], ["Timetable", "/portal/timetable"]] : []),
    ...(role === "pupil" ? [["My Learning", "/portal/pupil/learning"], ["Attendance", "/portal/pupil/attendance"], ["Timetable", "/portal/timetable"]] : []),
    ...(role === "sponsor" ? [["Impact", "/portal/sponsor/impact"], ["Attendance", "/portal/sponsor/attendance"], ["Timetable", "/portal/timetable"]] : []),
    ...(role === "parent" ? [["My Children", "/portal/parent#children"], ["Attendance", "/portal/parent/attendance"], ["Timetable", "/portal/timetable"], ["School Updates", "/portal/notifications"]] : [["Notifications", "/portal/notifications"]]),
  ];
  const logout = () => { localStorage.removeItem("angelshome_token"); localStorage.removeItem("angelshome_session"); navigate("/login", { replace: true }); };
  const isActive = (href) => href.split("#")[0] === location.pathname;
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block"><div className="border-b border-slate-100 px-6 py-6"><Link to="/" className="text-xl font-black text-blue-950">Angels Home</Link><p className="mt-1 text-xs font-semibold uppercase tracking-widest text-amber-600">Education Centre</p></div><nav className="space-y-1 p-4" aria-label="Portal navigation">{links.map(([label, href]) => <Link key={href} to={href} className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive(href) ? "bg-blue-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-blue-950"}`}>{label}</Link>)}</nav><button onClick={logout} className="absolute bottom-6 left-4 right-4 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-blue-950">Sign out</button></aside>
    <main className="min-h-screen lg:pl-64"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">{roleLabels[role] || "Portal"}</p><h1 className="text-xl font-black text-blue-950">School Portal</h1></div><div className="flex items-center gap-2"><Link to="/portal/notifications" aria-label="Open notifications" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200">🔔 <span className="hidden sm:inline">Notifications</span></Link><button onClick={logout} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 lg:hidden">Sign out</button></div></div></header><nav className="border-b border-slate-200 bg-white px-5 py-3 lg:hidden" aria-label="Mobile portal navigation"><div className="flex gap-2 overflow-x-auto pb-1">{links.map(([label, href]) => <Link key={href} to={href} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${isActive(href) ? "bg-blue-950 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</Link>)}</div></nav><div className="p-5 md:p-8">{children}</div></main>
  </div>;
}
