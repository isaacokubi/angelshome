import { useEffect, useState } from "react";
import PortalShell from "../components/PortalShell";
import { apiRequest } from "../services/api";

export default function AdminClassRequests() {
  const [pupils, setPupils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/learning/class-requests");
      setPupils(response.pupils || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (id, action) => {
    setBusy(`${id}-${action}`);
    setError("");
    try {
      await apiRequest(`/learning/class-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <PortalShell role="admin">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Admissions & enrolment</p>
        <h2 className="text-3xl font-black text-blue-950">Class confirmation requests</h2>
        <p className="mt-2 text-slate-600">Pupils choose a requested class during registration. Confirm the placement here to activate their class and digital classroom access.</p>
      </div>
      {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Loading requests…</div>
      ) : pupils.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-4">Pupil</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Requested class</th><th className="px-5 py-4">Registered</th><th className="px-5 py-4">Action</th></tr>
            </thead>
            <tbody>
              {pupils.map((pupil) => (
                <tr key={pupil._id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-bold text-blue-950">{pupil.name}</td>
                  <td className="px-5 py-4 text-slate-600">{pupil.email}</td>
                  <td className="px-5 py-4 font-semibold">{pupil.requestedClassId?.name}{pupil.requestedClassId?.stream ? ` · ${pupil.requestedClassId.stream}` : ""}<span className="block text-xs text-slate-400">{pupil.requestedClassId?.academicYear}</span></td>
                  <td className="px-5 py-4 text-slate-600">{new Date(pupil.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4"><div className="flex gap-2"><button disabled={!!busy} onClick={() => act(pupil._id, "confirm")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">{busy === `${pupil._id}-confirm` ? "Confirming…" : "Confirm class"}</button><button disabled={!!busy} onClick={() => act(pupil._id, "reject")} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{busy === `${pupil._id}-reject` ? "Rejecting…" : "Reject"}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No pending class confirmation requests.</div>
      )}
    </PortalShell>
  );
}
