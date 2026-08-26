import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import { adminRecordsApi } from "../services/adminRecordsApi";

const OMIT_FIELDS = new Set(["password", "passwordHash", "token", "resetToken", "refreshToken"]);
const humanize = (value) => value.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
const shortValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 90);
  return String(value).slice(0, 90);
};

function editorValue(field, record) {
  const value = record?.[field.name];
  if (field.type === "Array" || field.type === "Mixed" || field.type === "Object") return value == null ? "" : JSON.stringify(value, null, 2);
  if (field.type === "Boolean") return Boolean(value);
  if (field.type === "Date" && value) return new Date(value).toISOString().slice(0, 16);
  return value ?? "";
}

function EditModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries(item.schema.filter((field) => !OMIT_FIELDS.has(field.name)).map((field) => [field.name, editorValue(field, item.record)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const body = {};
      item.schema.filter((field) => !OMIT_FIELDS.has(field.name)).forEach((field) => {
        let value = form[field.name];
        if (["Array", "Mixed", "Object"].includes(field.type) && typeof value === "string" && value.trim()) {
          try { value = JSON.parse(value); } catch { throw new Error(`${field.label} must contain valid JSON.`); }
        }
        if (field.type === "Date" && value) value = new Date(value).toISOString();
        body[field.name] = value;
      });
      await adminRecordsApi.update(item.type, item.record._id, body);
      onSaved();
      onClose();
    } catch (err) { setError(err.message || "Unable to save record"); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Edit record</p><h2 className="mt-1 text-xl font-black text-blue-950">{item.label}</h2><p className="text-xs text-slate-500">ID: {item.record._id}</p></div>
        <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button>
      </div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
        {item.schema.filter((field) => !OMIT_FIELDS.has(field.name)).map((field) => {
          const value = form[field.name];
          const common = { className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" };
          return <label key={field.name} className={field.type === "Array" || ["Mixed", "Object"].includes(field.type) ? "md:col-span-2" : ""}>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">{field.label}{field.required ? " *" : ""}</span>
            {field.enumValues?.length ? <select {...common} value={value} onChange={(e) => setField(field.name, e.target.value)}><option value="">Select…</option>{field.enumValues.map((option) => <option key={option} value={option}>{option}</option>)}</select>
              : field.type === "Boolean" ? <div className="mt-2 flex items-center gap-2"><input type="checkbox" checked={Boolean(value)} onChange={(e) => setField(field.name, e.target.checked)} /><span className="text-sm text-slate-700">Enabled</span></div>
              : field.type === "Number" ? <input {...common} type="number" value={value} onChange={(e) => setField(field.name, e.target.value)} />
              : field.type === "Date" ? <input {...common} type="datetime-local" value={value} onChange={(e) => setField(field.name, e.target.value)} />
              : ["Array", "Mixed", "Object"].includes(field.type) ? <textarea {...common} rows={7} value={value} onChange={(e) => setField(field.name, e.target.value)} />
              : <input {...common} type="text" value={value} onChange={(e) => setField(field.name, e.target.value)} />}
          </label>;
        })}
        <div className="md:col-span-2 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} type="submit" className="rounded-xl bg-blue-900 px-5 py-2 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  </div>;
}

export default function AdminRecordManager() {
  const [types, setTypes] = useState([]);
  const [type, setType] = useState("");
  const [payload, setPayload] = useState({ schema: [], records: [], label: "Records" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState("");

  const loadTypes = async () => {
    const result = await adminRecordsApi.types();
    const nextTypes = result.types || [];
    setTypes(nextTypes);
    if (!type && nextTypes[0]) setType(nextTypes[0].key);
  };

  const loadRecords = async (selectedType = type) => {
    if (!selectedType) return;
    setLoading(true); setError("");
    try { setPayload(await adminRecordsApi.list(selectedType, { search, limit: 200 })); }
    catch (err) { setError(err.message || "Unable to load records"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTypes().catch((err) => setError(err.message || "Unable to load record types")).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (type) loadRecords(type); }, [type]);

  const visibleFields = useMemo(() => payload.schema.filter((field) => !OMIT_FIELDS.has(field.name)).slice(0, 6), [payload.schema]);

  const remove = async (record) => {
    if (!window.confirm(`Delete this ${payload.label.replace(/s$/, "").toLowerCase()} record? This action cannot be undone.`)) return;
    setBusyId(record._id); setError("");
    try { await adminRecordsApi.remove(type, record._id); await Promise.all([loadRecords(type), loadTypes()]); }
    catch (err) { setError(err.message || "Unable to delete record"); }
    finally { setBusyId(""); }
  };

  const refresh = async () => { await loadTypes(); await loadRecords(type); };

  return <AdminLayout title="Records Management">
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Administration</p><h1 className="mt-1 text-2xl font-black text-blue-950">All school records</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Edit and delete live records from one protected administrator workspace. Changes are written directly to the same database used by the school portals.</p></div>
          <button type="button" onClick={refresh} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-50">Refresh</button>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_320px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadRecords(type); }} placeholder={`Search ${payload.label.toLowerCase()}…`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-blue-950">
            {types.map((item) => <option key={item.key} value={item.key}>{item.label} ({item.count})</option>)}
          </select>
        </div>

        {loading ? <div className="mt-6 rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">Loading records…</div> : !payload.records?.length ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No records found.</div> : <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{visibleFields.map((field) => <th key={field.name} className="px-4 py-3 font-black">{field.label}</th>)}<th className="px-4 py-3 text-right font-black">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{payload.records.map((record) => <tr key={record._id} className="hover:bg-slate-50/80">{visibleFields.map((field) => <td key={field.name} className="max-w-xs px-4 py-3 align-top text-slate-700">{shortValue(record[field.name])}</td>)}<td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing({ type, label: payload.label, schema: payload.schema, record })} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 hover:bg-blue-100">Edit</button><button type="button" disabled={busyId === record._id} onClick={() => remove(record)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50">{busyId === record._id ? "Deleting…" : "Delete"}</button></div></td></tr>)}</tbody>
          </table>
        </div>}
      </div>
    </div>
    {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSaved={() => loadRecords(type)} />}
  </AdminLayout>;
}
