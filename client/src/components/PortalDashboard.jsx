import { Link } from "react-router-dom";
import PortalShell from "./PortalShell";

const data = {
  admin: { title: "School overview", subtitle: "Monitor learning, people, communications and school growth.", stats: [["Pupils", "248", "12 new this term"], ["Teachers", "24", "2 pending profiles"], ["Sponsors", "36", "KES 1.8M this year"], ["Attendance", "94.6%", "Up 2.4%"]] },
  teacher: { title: "Teaching overview", subtitle: "Keep your classes, attendance and communication organised.", stats: [["My pupils", "38", "Across 3 classes"], ["Attendance", "96%", "This week"], ["Assignments", "12", "4 due today"], ["Messages", "7", "Unread"]] },
  pupil: { title: "My learning", subtitle: "See your progress, timetable, assignments and school updates.", stats: [["Attendance", "97%", "Excellent"], ["Subjects", "9", "Current term"], ["Assignments", "4", "Due this week"], ["Average", "78%", "Improving"]] },
  sponsor: { title: "Your impact", subtitle: "Follow the learners and programmes you help support.", stats: [["Supported pupils", "8", "Active sponsorships"], ["Contributions", "KES 420K", "This year"], ["Projects", "3", "In progress"], ["Updates", "6", "New this month"]] },
};

export default function PortalDashboard({ role }) {
  const d = data[role] || data.pupil;
  return <PortalShell role={role}>
    <div className="mb-8"><p className="text-sm font-bold text-amber-600">WELCOME BACK</p><h2 className="mt-1 text-3xl font-black text-blue-950">{d.title}</h2><p className="mt-2 max-w-2xl text-slate-600">{d.subtitle}</p></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{d.stats.map(([label, value, note]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-blue-950">{value}</p><p className="mt-2 text-xs font-semibold text-emerald-600">{note}</p></div>)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-4">{["School announcement published", "Attendance records updated", "New message received", "Term calendar updated"].map((item, i) => <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">{item}</p><p className="text-xs text-slate-500">{i + 1} hour{i ? "s" : ""} ago</p></div><span className="h-2 w-2 rounded-full bg-amber-500" /></div>)}</div></section>
      <section className="rounded-2xl bg-blue-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-amber-400">Need help?</p><h3 className="mt-2 text-xl font-black">Contact Angels Home</h3><p className="mt-3 text-sm leading-6 text-blue-100">Reach the school office directly on WhatsApp for support and urgent enquiries.</p><a href="https://wa.me/?text=Hello%20Angels%20Home%20Education%20Centre" target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950">Message on WhatsApp</a></section>
    </div>
  </PortalShell>;
}
