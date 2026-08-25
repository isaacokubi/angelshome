import { useEffect, useState } from "react";
import { settingsApi } from "../services/settingsApi";
import { defaults, useSchoolSettings } from "../context/SchoolSettingsContext";

const clone = (value) => JSON.parse(JSON.stringify(value));
const merge = (base, value) => {
  if (Array.isArray(base)) return Array.isArray(value) && value.length ? value : base;
  if (base && typeof base === "object") return Object.fromEntries(Object.keys(base).map((key) => [key, merge(base[key], value?.[key])]));
  return value ?? base;
};

function TextField({ label, value, onChange, type = "text" }) {
  return <label className="block"><span className="text-sm font-bold text-slate-700">{label}</span><input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
}

function JsonEditor({ title, description, value, onChange }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(JSON.stringify(value, null, 2)); }, [value]);
  function change(next) {
    setText(next);
    try { onChange(JSON.parse(next)); setInvalid(false); } catch { setInvalid(true); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-blue-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p><textarea value={text} onChange={(e) => change(e.target.value)} rows={18} spellCheck={false} className={`mt-5 w-full rounded-xl border bg-slate-950 p-4 font-mono text-xs leading-6 text-green-200 outline-none ${invalid ? "border-red-400" : "border-slate-800"}`} />{invalid && <p className="mt-2 text-xs font-bold text-red-600">Invalid JSON — fix the highlighted content before saving.</p>}</section>;
}

export default function AdminSettings() {
  const { refresh: refreshGlobalSettings } = useSchoolSettings();
  const [settings, setSettings] = useState(clone(defaults));
  const [tab, setTab] = useState("school");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => { settingsApi.get().then((payload) => setSettings(merge(defaults, payload?.data))).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);
  const updateSection = (section, value) => setSettings((current) => ({ ...current, [section]: value }));
  async function save() {
    setSaving(true); setMessage(""); setError("");
    try {
      const result = await settingsApi.update(settings);
      const savedSettings = merge(defaults, result?.data);
      setSettings(savedSettings);
      await refreshGlobalSettings();
      setMessage("Saved successfully. Changes are now live across the public website and portal branding.");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  if (loading) return <div className="rounded-2xl bg-white p-8 shadow-sm">Loading school settings…</div>;
  const tabs = [["school", "School & contact"], ["homepage", "Homepage"], ["about", "About"], ["academics", "Academics"], ["support", "Support"]];
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-900 p-7 text-white shadow-lg"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Central website control</p><h1 className="mt-2 text-3xl font-black">School Settings</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Change the school identity, contact details and public website content from one place. Saving here updates the shared settings used by the website and portal.</p></header>
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? "bg-blue-950 text-white shadow" : "text-slate-600 hover:bg-white"}`}>{label}</button>)}</nav>
    {message && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
    {tab === "school" && <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-blue-950">School identity</h2><div className="mt-6 grid gap-5"><TextField label="School name" value={settings.school.name} onChange={(v) => updateSection("school", { ...settings.school, name: v })} /><TextField label="Short name" value={settings.school.shortName} onChange={(v) => updateSection("school", { ...settings.school, shortName: v })} /><TextField label="Motto / tagline" value={settings.school.motto} onChange={(v) => updateSection("school", { ...settings.school, motto: v })} /><TextField label="Logo URL" value={settings.school.logo} onChange={(v) => updateSection("school", { ...settings.school, logo: v })} /></div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-blue-950">Contact information</h2><div className="mt-6 grid gap-5"><TextField label="Phone" value={settings.contact.phone} onChange={(v) => updateSection("contact", { ...settings.contact, phone: v })} /><TextField label="Email" value={settings.contact.email} onChange={(v) => updateSection("contact", { ...settings.contact, email: v })} type="email" /><TextField label="WhatsApp" value={settings.contact.whatsapp} onChange={(v) => updateSection("contact", { ...settings.contact, whatsapp: v })} /><TextField label="Physical address" value={settings.contact.address} onChange={(v) => updateSection("contact", { ...settings.contact, address: v })} /><TextField label="Postal address" value={settings.contact.postalAddress} onChange={(v) => updateSection("contact", { ...settings.contact, postalAddress: v })} /><TextField label="Office hours" value={settings.contact.officeHours} onChange={(v) => updateSection("contact", { ...settings.contact, officeHours: v })} /><TextField label="Map embed URL" value={settings.contact.mapEmbed} onChange={(v) => updateSection("contact", { ...settings.contact, mapEmbed: v })} /></div></section><JsonEditor title="Branding & social links" description="Edit social URLs and footer description." value={{ social: settings.social, footer: settings.footer }} onChange={(value) => setSettings((current) => ({ ...current, social: value.social || current.social, footer: value.footer || current.footer }))} /></div>}
    {tab === "homepage" && <JsonEditor title="Homepage editor" description="Edit the complete homepage configuration: hero, statistics, education section, promises, community pathways, development fund and final call to action." value={settings.homepage} onChange={(value) => updateSection("homepage", value)} />}
    {tab === "about" && <JsonEditor title="About page editor" description="Edit the About page title, story, mission, vision and core values. Leadership/staff records remain managed separately." value={settings.about} onChange={(value) => updateSection("about", value)} />}
    {tab === "academics" && <JsonEditor title="Academics page editor" description="Edit the academic page copy, curriculum sections, programmes and subjects, and fee note." value={settings.academics} onChange={(value) => updateSection("academics", value)} />}
    {tab === "support" && <JsonEditor title="Support page editor" description="Edit support messaging, priorities, targets and donation instructions." value={settings.support} onChange={(value) => updateSection("support", value)} />}
    <div className="sticky bottom-4 flex justify-end"><button onClick={save} disabled={saving} className="rounded-xl bg-amber-400 px-7 py-3.5 font-black text-blue-950 shadow-xl hover:bg-amber-300 disabled:opacity-60">{saving ? "Saving changes…" : "Save all settings"}</button></div>
  </div>;
}
