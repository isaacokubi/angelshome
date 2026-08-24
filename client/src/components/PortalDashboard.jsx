import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "./PortalShell";
import { portalApi } from "../services/api";

const academicMetric = (value, suffix = "") => value == null ? "Not recorded" : `${value}${suffix}`;

function ParentChildCard({ child }) {
  const academic = child.academic;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Pupil</p>
          <h3 className="mt-1 text-xl font-black text-blue-950">{child.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{academic?.className || "Class not recorded"}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-lg" aria-hidden="true">🎓</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="Attendance" value={academicMetric(academic?.attendanceRate, "%")} />
        <Metric label="Average" value={academicMetric(academic?.averageScore, "%")} />
        <Metric label="Subjects" value={academicMetric(academic?.subjectsCount)} />
        <Metric label="Assignments due" value={academicMetric(academic?.assignmentsDue)} />
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent view</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Academic information is shown from the latest school records. Missing values mean the school has not published that information yet.
        </p>
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-blue-950">{value}</p></div>;
}

function ParentDashboardContent({ data }) {
  const children = data.children || [];
  const unread = data.unreadNotifications || 0;
  return (
    <>
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-950 to-blue-900 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Parent & family portal</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">Welcome back, {data.profile.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Stay informed about your child&apos;s school journey, receive important announcements and keep communication with the school in one place.</p>
          </div>
          {unread > 0 && <Link to="/portal/notifications" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950 transition hover:bg-amber-300">Review {unread} unread update{unread === 1 ? "" : "s"}</Link>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">{stat.label}</p><p className="mt-3 text-3xl font-black text-blue-950">{stat.value}</p><p className="mt-2 text-xs font-semibold text-slate-500">{stat.note}</p></div>)}
      </div>

      <section id="children" className="mt-8 scroll-mt-28">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Family overview</p><h3 className="text-2xl font-black text-blue-950">My children</h3><p className="mt-1 text-sm text-slate-500">Review the academic information the school has shared with your account.</p></div>
          <Link to="/portal/notifications" className="text-sm font-bold text-blue-700 hover:text-blue-900">View school updates →</Link>
        </div>
        {children.length ? <div className="grid gap-5 lg:grid-cols-2">{children.map((child) => <ParentChildCard key={child._id} child={child} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 shadow-sm md:p-10"><div className="flex flex-col gap-5 md:flex-row md:items-center"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl" aria-hidden="true">👨‍👩‍👧</span><div><h4 className="text-lg font-black text-blue-950">No child accounts are linked yet</h4><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Your parent account is active, but the school has not linked a pupil account to it yet. Contact the school office so they can verify your details and connect your child securely.</p><Link to="/contact" className="mt-4 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-900">Contact the school office</Link></div></div></div>}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Communication</p><h3 className="mt-1 text-lg font-black text-blue-950">Recent school updates</h3></div><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div>
          <div className="mt-5 space-y-3">{data.notifications.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm" aria-hidden="true">🔔</span><div><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No school activity has been published for your account.</div>}</div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Parent toolkit</p>
          <h3 className="mt-1 text-xl font-black text-blue-950">Quick actions</h3>
          <div className="mt-5 space-y-3">
            <Link to="/portal/notifications" className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"><p className="font-bold text-blue-950">🔔 School notifications</p><p className="mt-1 text-xs leading-5 text-slate-500">Read announcements, reminders and important alerts.</p></Link>
            <Link to="/contact" className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"><p className="font-bold text-blue-950">💬 Contact the school</p><p className="mt-1 text-xs leading-5 text-slate-500">Reach the school office through the official contact channel.</p></Link>
            {import.meta.env.VITE_SCHOOL_WHATSAPP && <a href={`https://wa.me/${String(import.meta.env.VITE_SCHOOL_WHATSAPP).replace(/\D/g, "")}?text=${encodeURIComponent(`Hello Angels Home Education Centre. I am ${data.profile.name} and need assistance with my parent portal account.`)}`} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"><p className="font-bold text-blue-950">📱 WhatsApp school office</p><p className="mt-1 text-xs leading-5 text-slate-500">Start a support conversation using the configured school number.</p></a>}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Your account</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="text-lg font-black text-blue-950">Keep your contact details current</h3><p className="mt-1 text-sm leading-6 text-slate-600">The school uses your registered account details when communicating important information. Contact the office if your phone number or email needs to be updated.</p></div><Link to="/contact" className="inline-flex shrink-0 rounded-xl bg-blue-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-900">Request an update</Link></div>
      </section>
    </>
  );
}

export default function PortalDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    portalApi.dashboard()
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const role = data?.profile?.role || "pupil";
  return (
    <PortalShell role={role}>
      {loading && <div className="space-y-5" aria-live="polite"><div className="h-44 animate-pulse rounded-3xl bg-slate-200" /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700"><p>{error}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white">Try again</button></div>}
      {!loading && !error && data && role === "parent" && <ParentDashboardContent data={data} />}
      {!loading && !error && data && role !== "parent" && <StandardDashboard data={data} role={role} />}
    </PortalShell>
  );
}

function StandardDashboard({ data, role }) {
  return <>
    <div className="mb-8"><p className="text-sm font-bold text-amber-600">{data?.profile?.name ? `WELCOME BACK, ${data.profile.name.toUpperCase()}` : "SCHOOL PORTAL"}</p><h2 className="mt-1 text-3xl font-black text-blue-950">{role === "pupil" ? "My learning" : `${data?.profile?.roleLabel || "School"} dashboard`}</h2><p className="mt-2 max-w-2xl text-slate-600">Your portal information is loaded from the school database and reflects your current account.</p></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{data.stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">{stat.label}</p><p className="mt-3 text-3xl font-black text-blue-950">{stat.value}</p><p className="mt-2 text-xs font-semibold text-slate-500">{stat.note}</p></div>)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-blue-950">Recent school activity</h3><Link to="/portal/notifications" className="text-sm font-bold text-blue-700">View all</Link></div><div className="mt-5 space-y-4">{data.notifications.length ? data.notifications.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" /></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No school activity has been published for your account.</div>}</div></section><section className="rounded-2xl bg-blue-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-amber-400">School office</p><h3 className="mt-2 text-xl font-black">Need assistance?</h3><p className="mt-3 text-sm leading-6 text-blue-100">Contact the school through the official contact channel configured for this deployment.</p>{import.meta.env.VITE_SCHOOL_WHATSAPP ? <a href={`https://wa.me/${String(import.meta.env.VITE_SCHOOL_WHATSAPP).replace(/\D/g, "")}?text=${encodeURIComponent(`Hello Angels Home Education Centre. I am ${data.profile.name} and need assistance with my school portal account.`)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950">Message on WhatsApp</a> : <Link to="/contact" className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950">Contact the school</Link>}</section></div>
  </>;
}
