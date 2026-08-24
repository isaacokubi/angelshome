import { Link, useLocation, useNavigate } from "react-router-dom";

const roleLabels = {
  admin: "Administrator",
  teacher: "Teacher",
  pupil: "Pupil",
  sponsor: "Sponsor",
  parent: "Parent",
};

export default function PortalShell({ role, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const links = [
    ["Dashboard", `/portal/${role}`],
    ...(role === "admin" ? [["Pupils", "/portal/admin/pupils"], ["Teachers", "/portal/admin/teachers"], ["Sponsors", "/portal/admin/sponsors"]] : []),
    ...(role === "teacher" ? [["My Classes", "/portal/teacher/classes"]] : []),
    ...(role === "pupil" ? [["My Learning", "/portal/pupil/learning"]] : []),
    ...(role === "sponsor" ? [["Impact", "/portal/sponsor/impact"]] : []),
    ["Notifications", "/portal/notifications"],
  ];

  const logout = () => {
    localStorage.removeItem("angelshome_session");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="border-b border-slate-100 px-6 py-6">
          <Link to="/" className="text-xl font-black text-blue-950">Angels Home</Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-amber-600">Education Centre</p>
        </div>
        <nav className="space-y-1 p-4">
          {links.map(([label, href]) => <Link key={href} to={href} className={`block rounded-xl px-4 py-3 text-sm font-semibold ${location.pathname === href ? "bg-blue-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</Link>)}
        </nav>
        <button onClick={logout} className="absolute bottom-6 left-4 right-4 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Sign out</button>
      </aside>
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">{roleLabels[role]}</p><h1 className="text-xl font-black text-blue-950">School Portal</h1></div>
            <Link to="/portal/notifications" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">🔔 Notifications</Link>
          </div>
        </header>
        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
