import { useEffect, useState } from "react";
import PortalShell from "../components/PortalShell";
import { apiRequest, notificationApi } from "../services/api";

const titleFor = (type) => type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : "Users";

export function Management({ type }) {
  const [users, setUsers] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; apiRequest(`/portal/users?role=${encodeURIComponent(type === "pupils" ? "pupil" : type === "teachers" ? "teacher" : type === "sponsors" ? "sponsor" : "parent")}`).then((r) => active && setUsers(r.users || [])).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [type]);
  return <PortalShell role="admin"><div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Administration</p><h2 className="text-3xl font-black text-blue-950">{titleFor(type)}</h2><p className="mt-2 text-slate-600">Live records from the school user database.</p></div>{error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading records…</div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{users.length ? <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Name</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Joined</th></tr></thead><tbody>{users.map((user) => <tr key={user._id} className="border-t border-slate-100"><td className="px-5 py-4 font-bold text-blue-950">{user.name}</td><td className="px-5 py-4 text-slate-600">{user.email}</td><td className="px-5 py-4 text-slate-600">{user.role}</td><td className="px-5 py-4 text-slate-600">{user.phone || "Not provided"}</td><td className="px-5 py-4 text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table> : <div className="p-12 text-center text-slate-500">No records have been created for this group.</div>}</div>}</PortalShell>;
}

export function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [role] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem("angelshome_session") || "null");
      return session?.role || "pupil";
    } catch (error) {
      return "pupil";
    }
  });

  useEffect(() => {
    let active = true;
    notificationApi.list().then((r) => active && setItems(r.notifications || [])).catch((e) => active && setError(e.message));
    return () => { active = false; };
  }, []);

  return <PortalShell role={role}><div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Communications</p><h2 className="text-3xl font-black text-blue-950">Notifications</h2><p className="mt-2 text-slate-600">Live announcements and alerts delivered to your account.</p></div>{error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}<div className="grid gap-4">{items.length ? items.map((item) => <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">🔔</span><div><h3 className="font-black text-slate-900">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div></div></article>) : !error && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No notifications have been published for your account.</div>}</div></PortalShell>;
}

export function Learning({ role = "pupil" }) { const [records, setRecords] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); useEffect(() => { apiRequest("/portal/learning").then((r) => setRecords(r.records || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []); return <PortalShell role={role}><div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Learning</p><h2 className="text-3xl font-black text-blue-950">My classes & learning</h2><p className="mt-2 text-slate-600">Subjects, lesson schedules and progress recorded by the school.</p></div>{error && <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading learning records…</div> : records.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => <article key={record._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</p><h3 className="mt-2 text-lg font-black text-blue-950">{record.subject}</h3><p className="mt-3 text-sm text-slate-600">{record.nextLesson ? `Next lesson · ${new Date(record.nextLesson).toLocaleString()}` : "Next lesson not scheduled"}</p>{record.teacher?.name && <p className="mt-2 text-sm text-slate-500">Teacher · {record.teacher.name}</p>}{record.progress != null && <><div className="mt-4 flex justify-between text-xs font-bold text-slate-500"><span>Progress</span><span>{record.progress}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${record.progress}%` }} /></div></>}</article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No learning records have been assigned to your account yet.</div>}</PortalShell>; }
