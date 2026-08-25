import { Link } from "react-router-dom";
import { useState } from "react";
import { useSchoolSettings } from "../context/SchoolSettingsContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { settings } = useSchoolSettings();
  const { school } = settings;
  const nav = [["Home", "/"], ["About", "/about"], ["Academics", "/academics"], ["Teachers", "/teachers"], ["Sponsors", "/sponsors"], ["Support", "/support"], ["Contact", "/contact"]];
  return <>
    <div className="bg-amber-400 px-4 py-2 text-center text-xs font-bold text-blue-950">Admissions, partnerships and school support · Welcome to {school.name}</div>
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-blue-950 text-white shadow-lg"><div className="mx-auto max-w-7xl px-5"><div className="flex min-h-20 items-center justify-between gap-5"><Link to="/" className="flex items-center gap-3 leading-tight"><img src={school.logo} alt="" className="h-10 w-10 rounded-lg object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} /><span><span className="block text-lg font-black sm:text-xl">{school.shortName}</span><span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">{school.name.replace(school.shortName, "").trim() || "Education Centre"}</span></span></Link><div className="hidden items-center gap-5 lg:flex">{nav.map(([label, href]) => <Link key={href} to={href} className="text-sm font-semibold text-blue-100 transition hover:text-amber-400">{label}</Link>)}<Link to="/login" className="rounded-xl border border-blue-700 px-4 py-2 text-sm font-bold hover:bg-blue-900">Portal login</Link><Link to="/register" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-blue-950 hover:bg-amber-300">Register</Link></div><button aria-label="Open menu" onClick={() => setOpen(!open)} className="text-2xl lg:hidden">☰</button></div>{open && <div className="border-t border-blue-800 py-5 lg:hidden">{nav.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} to={href} className="block rounded-lg px-3 py-3 font-semibold hover:bg-blue-900">{label}</Link>)}<div className="mt-3 flex gap-3"><Link to="/login" className="rounded-xl border border-blue-700 px-4 py-2 font-bold">Login</Link><Link to="/register" className="rounded-xl bg-amber-400 px-4 py-2 font-black text-blue-950">Register</Link></div></div>}</div></nav>
  </>;
}
