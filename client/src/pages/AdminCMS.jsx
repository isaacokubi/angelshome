import { Link } from "react-router-dom";

const cards = [
  ["Staff", "Manage teachers and administration profiles.", "/admin/cms/staff"],
  ["Hero Slides", "Control homepage banners and visual storytelling.", "/admin/cms/hero"],
  ["Gallery", "Manage school activity photos.", "/admin/cms/gallery"],
  ["Events", "Manage academic calendar and events.", "/admin/cms/events"],
  ["Fees", "Update fee structure and published fee information.", "/admin/cms/fees"],
];

export default function AdminCMS() {
  return <div className="mx-auto max-w-6xl space-y-6"><div className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-900 p-7 text-white shadow-lg"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Website management</p><h1 className="mt-2 text-3xl font-black">Content Management System</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Manage public school content without changing source code. Use School Settings for the central identity, contact information and page content.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{cards.map(([title, description, href]) => <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"><h2 className="text-xl font-black text-blue-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><span className="mt-5 inline-block text-sm font-black text-blue-700">Manage →</span></Link>)}<Link to="/admin/cms/settings" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><p className="text-xs font-black uppercase tracking-widest text-amber-700">Recommended</p><h2 className="mt-2 text-xl font-black text-blue-950">School Settings</h2><p className="mt-2 text-sm leading-6 text-slate-600">Change the school name, logo, contact details, homepage, About, Academics, Support and Contact content from one place.</p><span className="mt-5 inline-block rounded-lg bg-blue-950 px-4 py-2 text-sm font-black text-white">Open settings →</span></Link></div></div>;
}
