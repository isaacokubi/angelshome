import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const label = (item) => `${item?.name || "Item"}${item?.stream ? ` · ${item.stream}` : ""}${item?.code ? ` (${item.code})` : ""}`;

export default function TimetableResourceManager({ locked = false, onChanged }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [classResult, subjectResult] = await Promise.all([apiRequest("/smis/classes"), apiRequest("/smis/subjects")]);
      setClasses(classResult?.classes || []); setSubjects(subjectResult?.subjects || []);
    } catch (e) { setError(e.message || "Unable to load classes and subjects."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const remove = async (type, item) => {
    if (locked) return;
    const resource = type === "class" ? "class" : "subject";
    if (!window.confirm(`Delete ${resource} ${label(item)}? This will remove it from active timetable setup.`)) return;
    const key = `${type}:${item._id}`; setBusy(key); setError("");
    try { await apiRequest(`/smis/timetable/resources/${type}s/${item._id}`, { method: "DELETE" }); await load(); onChanged?.(); }
    catch (e) { setError(e.message || `Unable to delete ${resource}.`); }
    finally { setBusy(""); }
  };

  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
    <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center"><div><h3 className="text-base font-black text-blue-950">Manage classes & subjects</h3><p className="text-xs text-slate-500">Remove incorrect resources before building lesson plans. Deletion is disabled while the timetable is locked.</p></div><button type="button" onClick={() => void load()} disabled={loading || Boolean(busy)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">{loading ? "Refreshing…" : "Refresh"}</button></div>
    {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
    {loading ? <p className="text-sm text-slate-500">Loading resources…</p> : <div className="grid gap-5 lg:grid-cols-2">
      <div><h4 className="mb-2 text-sm font-black text-slate-700">Classes ({classes.length})</h4><div className="space-y-2">{classes.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"><span className="text-sm font-semibold text-slate-700">{label(item)}</span><button type="button" disabled={locked || Boolean(busy)} onClick={() => void remove("class", item)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">{busy === `class:${item._id}` ? "Deleting…" : "Delete"}</button></div>)}{!classes.length && <p className="text-sm text-slate-400">No active classes.</p>}</div></div>
      <div><h4 className="mb-2 text-sm font-black text-slate-700">Subjects ({subjects.length})</h4><div className="space-y-2">{subjects.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"><span className="text-sm font-semibold text-slate-700">{label(item)}</span><button type="button" disabled={locked || Boolean(busy)} onClick={() => void remove("subject", item)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">{busy === `subject:${item._id}` ? "Deleting…" : "Delete"}</button></div>)}{!subjects.length && <p className="text-sm text-slate-400">No active subjects.</p>}</div></div>
    </div>}
  </div>;
}
