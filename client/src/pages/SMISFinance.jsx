import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

export default function SMISFinance() {
  const [data, setData] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pupil: "", amount: "", paymentMethod: "mpesa", reference: "", term: "", academicYear: "" });
  const load = () => { setLoading(true); apiRequest("/finance/summary").then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const pupils = data?.pupils || []; const summary = data?.summary || {};
  const recent = useMemo(() => (data?.payments || []).slice(0, 10), [data]);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { await apiRequest("/finance/payments", { method: "POST", body: JSON.stringify(form) }); setForm({ pupil: "", amount: "", paymentMethod: "mpesa", reference: "", term: "", academicYear: "" }); load(); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  if (loading) return <div className="p-6 text-sm text-slate-500">Loading finance records...</div>;
  return <div className="space-y-6 p-6">
    <div><h1 className="text-2xl font-bold">Fees & Finance</h1><p className="text-sm text-slate-500">Live fee structures and payment records from the school database.</p></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Collected", `KES ${Number(summary.collected || 0).toLocaleString()}`],["Expected", `KES ${Number(summary.expected || 0).toLocaleString()}`],["Outstanding", `KES ${Number(summary.outstanding || 0).toLocaleString()}`],["Payments", summary.paymentCount || 0]].map(([label,value]) => <div key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-blue-950">{value}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="rounded-2xl border bg-white p-5"><h2 className="font-black text-blue-950">Record payment</h2><div className="mt-4 space-y-3">
        <select required className="w-full rounded-lg border p-2" value={form.pupil} onChange={(e)=>setForm({...form,pupil:e.target.value})}><option value="">Select pupil</option>{pupils.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select>
        <input required min="1" type="number" className="w-full rounded-lg border p-2" placeholder="Amount (KES)" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})}/>
        <select className="w-full rounded-lg border p-2" value={form.paymentMethod} onChange={(e)=>setForm({...form,paymentMethod:e.target.value})}><option value="mpesa">M-Pesa</option><option value="cash">Cash</option><option value="bank">Bank</option><option value="other">Other</option></select>
        <input className="w-full rounded-lg border p-2" placeholder="Payment reference" value={form.reference} onChange={(e)=>setForm({...form,reference:e.target.value})}/><input className="w-full rounded-lg border p-2" placeholder="Term" value={form.term} onChange={(e)=>setForm({...form,term:e.target.value})}/><input className="w-full rounded-lg border p-2" placeholder="Academic year" value={form.academicYear} onChange={(e)=>setForm({...form,academicYear:e.target.value})}/>
        <button disabled={saving} className="w-full rounded-lg bg-blue-950 px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save payment"}</button>
      </div></form>
      <section className="rounded-2xl border bg-white p-5 lg:col-span-2"><h2 className="font-black text-blue-950">Recent payments</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Pupil</th><th className="p-2">Method</th><th className="p-2">Reference</th><th className="p-2">Amount</th></tr></thead><tbody>{recent.length ? recent.map(p=><tr key={p._id} className="border-b"><td className="p-2">{p.pupil?.name || "Unknown"}</td><td className="p-2 uppercase">{p.paymentMethod}</td><td className="p-2">{p.reference || "—"}</td><td className="p-2 font-bold">KES {Number(p.amount||0).toLocaleString()}</td></tr>) : <tr><td colSpan="4" className="p-8 text-center text-slate-500">No fee payments recorded.</td></tr>}</tbody></table></div></section>
    </div>
    <section className="rounded-2xl border bg-white p-5"><h2 className="font-black text-blue-950">Fee structures</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Class</th><th className="p-2">Tuition</th><th className="p-2">Boarding</th><th className="p-2">Activity</th><th className="p-2">Other</th></tr></thead><tbody>{(data?.structures||[]).length ? data.structures.map(f=><tr key={f._id} className="border-b"><td className="p-2 font-medium">{f.className || "—"}</td><td className="p-2">KES {Number(f.tuition||0).toLocaleString()}</td><td className="p-2">KES {Number(f.boarding||0).toLocaleString()}</td><td className="p-2">KES {Number(f.activity||0).toLocaleString()}</td><td className="p-2">KES {Number(f.other||0).toLocaleString()}</td></tr>) : <tr><td colSpan="5" className="p-8 text-center text-slate-500">No fee structures configured.</td></tr>}</tbody></table></div></section>
  </div>;
}
