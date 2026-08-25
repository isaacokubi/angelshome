import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import PortalShell from "../components/PortalShell";

const grade = (marks, maxMarks) => {
  const percentage = maxMarks ? (Number(marks) / Number(maxMarks)) * 100 : 0;
  return percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : percentage >= 50 ? "D" : percentage >= 40 ? "E" : "F";
};

export default function PortalResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exam, setExam] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await apiRequest(`/portal/results${exam ? `?exam=${encodeURIComponent(exam)}` : ""}`)); }
    catch (err) { setError(err.message || "Unable to load school results."); }
    finally { setLoading(false); }
  }, [exam]);

  useEffect(() => { void load(); }, [load]);

  const exams = useMemo(() => [...new Map((data?.results || []).filter((r) => r.exam?._id).map((r) => [r.exam._id, r.exam])).values()], [data]);
  const average = data?.summary?.average;
  const performance = average == null ? "Awaiting assessment data" : average >= 80 ? "Excellent performance" : average >= 60 ? "Good progress" : average >= 50 ? "Satisfactory progress" : "Needs improvement";

  return <PortalShell role={data?.profile?.role || "pupil"}>
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Angels Home SMIS</p><h1 className="mt-2 text-3xl font-black text-blue-950">Results & report cards</h1><p className="mt-2 text-slate-600">Live examination results from the school database.</p></div>
      <button onClick={() => load()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold">Refresh</button>
    </div>
    {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Results" value={data?.summary?.count ?? "—"} />
      <Stat label="Subjects" value={data?.summary?.subjects ?? "—"} />
      <Stat label="Average" value={average == null ? "Not recorded" : `${average}%`} />
    </div>
    <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-blue-950">Published school results</h2><p className="mt-1 text-sm text-slate-500">{performance}</p></div><select value={exam} onChange={(e) => setExam(e.target.value)} className="rounded-xl border p-3"><option value="">All examinations</option>{exams.map((item) => <option key={item._id} value={item._id}>{item.name}{item.term ? ` · ${item.term}` : ""}</option>)}</select></div>
      {loading ? <div className="mt-6 space-y-3">{[1,2,3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : data?.results?.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Pupil</th><th className="p-3">Examination</th><th className="p-3">Subject</th><th className="p-3">Marks</th><th className="p-3">Grade</th><th className="p-3">Comment</th></tr></thead><tbody>{data.results.map((row) => <tr key={row._id} className="border-t"><td className="p-3 font-bold">{row.pupil?.name || "—"}</td><td className="p-3">{row.exam?.name || "—"}</td><td className="p-3">{row.subject?.name || "—"}{row.subject?.code ? <span className="ml-2 text-xs text-slate-400">{row.subject.code}</span> : null}</td><td className="p-3">{row.marks}/{row.maxMarks}</td><td className="p-3 font-black text-blue-950">{row.grade || grade(row.marks, row.maxMarks)}</td><td className="p-3 text-slate-600">{row.teacherComment || "—"}</td></tr>)}</tbody></table></div> : <div className="mt-6 rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No examination results have been recorded for this account yet.</div>}
    </section>
  </PortalShell>;
}

function Stat({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-blue-950">{value}</p><p className="mt-1 text-xs text-slate-400">Live school database</p></div>; }
