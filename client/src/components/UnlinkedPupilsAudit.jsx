import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function UnlinkedPupilsAudit() {
  const [pupils, setPupils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/admin/unlinked-pupils");
      setPupils(Array.isArray(result?.pupils) ? result.pupils : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load the pupil account audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Account audit</p>
            {!loading && <span className={`rounded-full px-3 py-1 text-xs font-black ${pupils.length ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {pupils.length} unlinked
            </span>}
          </div>
          <h2 className="mt-1 text-xl font-black text-blue-950">Pupils without a parent account</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Active pupil accounts that are not linked through any parent account. Review these records to find incorrect registrations or accounts that need a family relationship.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-blue-950 hover:bg-slate-50 disabled:opacity-50">
            {loading ? "Checking…" : "Refresh audit"}
          </button>
          <Link to="/portal/admin/relationships" className="rounded-xl bg-blue-950 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-900">
            Manage relationships →
          </Link>
        </div>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {loading && <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Checking every active pupil against parent-child relationships…</div>}
      {!loading && !error && !pupils.length && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">✓ All active pupil accounts are linked to a parent account.</div>}
      {!loading && !error && pupils.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-red-100">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-red-50 text-xs uppercase tracking-wider text-red-700">
              <tr><th className="px-4 py-3">Pupil</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Registered</th><th className="px-4 py-3">Action</th></tr>
            </thead>
            <tbody>
              {pupils.map((pupil) => (
                <tr key={pupil._id} className="border-t border-slate-100">
                  <td className="px-4 py-4 font-black text-blue-950">{pupil.name || "Unnamed pupil"}</td>
                  <td className="px-4 py-4 text-slate-600">{pupil.email || "—"}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{pupil.phone || "Not provided"}</td>
                  <td className="px-4 py-4 text-slate-500">{pupil.createdAt ? new Date(pupil.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-4"><Link to="/portal/admin/relationships" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-900 hover:bg-blue-100">Link parent</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
