import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import PortalShell from "../components/PortalShell";

const modules = [
  ["Academic Years", "academic-years", "Academic year calendar and current-year control"],
  ["Lesson Planning", "lessons", "Teacher lesson plans, objectives and assessments"],
  ["Fees & Billing", "fees", "Fee structures and collected balances"],
  ["Inventory", "inventory", "Stock, minimum levels and school assets"],
  ["Transport", "transport", "Routes, pickup points, vehicles and drivers"],
  ["Meals", "meals", "Daily breakfast, lunch and snack plans"],
  ["Events", "events", "School calendar and published events"],
];

const initial = {
  "academic-years": { name: "", startDate: "", endDate: "", isCurrent: false },
  lessons: { schoolClass: "", subject: "", academicYear: "", term: "", topic: "", lessonDate: "", objectives: "", activities: "", assessment: "" },
  fees: { name: "", term: "", academicYear: "", amount: "", dueDate: "", description: "" },
  inventory: { name: "", category: "", quantity: 0, unit: "item", minimumStock: 0, location: "", supplier: "", unitCost: 0 },
  transport: { name: "", pickupPoints: "", fee: 0, departureTime: "", returnTime: "" },
  meals: { date: "", breakfast: "", lunch: "", snack: "", dinner: "", notes: "" },
  events: { title: "", description: "", startAt: "", endAt: "", location: "", audience: "all" },
};

const listKey = (active) => ({
  "academic-years": "academicYears",
  lessons: "lessons",
  fees: "structures",
  inventory: "items",
  transport: "routes",
  meals: "meals",
  events: "events",
}[active]);

export default function SMISOperationsHub() {
  const [active, setActive] = useState("academic-years");
  const [data, setData] = useState({});
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(initial["academic-years"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      apiRequest("/smis/classes"),
      apiRequest("/smis/subjects"),
      ...modules.map(([, key]) => apiRequest(`/smis/operations/${key}`)),
    ]);

    const [classesResult, subjectsResult, ...moduleResults] = results;
    setClasses(classesResult.status === "fulfilled" ? classesResult.value?.classes || [] : []);
    setSubjects(subjectsResult.status === "fulfilled" ? subjectsResult.value?.subjects || [] : []);

    const nextData = {};
    const failures = [];
    modules.forEach(([, key], index) => {
      const result = moduleResults[index];
      if (result?.status === "fulfilled") nextData[key] = result.value || {};
      else failures.push(key);
    });
    setData(nextData);
    if (failures.length) setError(`Some operations could not be loaded: ${failures.join(", ")}.`);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { setForm(initial[active]); setNotice(""); }, [active]);

  const list = useMemo(() => {
    const response = data[active] || {};
    return response[listKey(active)] || [];
  }, [data, active]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = { ...form };
      for (const key of ["objectives", "activities", "resources", "pickupPoints"]) {
        if (typeof payload[key] === "string") payload[key] = payload[key].split(",").map((value) => value.trim()).filter(Boolean);
      }
      if (active === "lessons" && !payload.topic) throw new Error("Topic is required.");
      await apiRequest(`/smis/operations/${active}`, { method: "POST", body: JSON.stringify(payload) });
      setNotice("Saved successfully.");
      setForm(initial[active]);
      await load();
    } catch (e) {
      setError(e.message || "Unable to save record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell role="admin">
      <div className="space-y-6">
        <header className="rounded-2xl bg-blue-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Angels Home SMIS</p>
          <h1 className="mt-2 text-3xl font-black">School Operations Centre</h1>
          <p className="mt-2 max-w-3xl text-sm text-blue-100">Manage the remaining day-to-day school operations from one workspace.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/admin/smis" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold">SMIS Dashboard</Link>
            <Link to="/admin/smis/finance" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold">Finance</Link>
            <Link to="/admin/smis/timetable" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold">Timetable</Link>
          </div>
        </header>

        {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border bg-white p-3 shadow-sm">
            {modules.map(([label, key, description]) => (
              <button key={key} onClick={() => setActive(key)} className={`mb-1 w-full rounded-xl p-3 text-left ${active === key ? "bg-blue-950 text-white" : "hover:bg-slate-50"}`}>
                <p className="font-black">{label}</p>
                <p className={`mt-1 text-xs ${active === key ? "text-blue-100" : "text-slate-500"}`}>{description}</p>
              </button>
            ))}
          </aside>

          <main className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-blue-950">{modules.find((item) => item[1] === active)?.[0]}</h2>
                <p className="text-sm text-slate-500">{loading ? "Loading records…" : `${list.length} record(s)`}</p>
              </div>
              <button onClick={() => void load()} className="rounded-xl border px-4 py-2 text-sm font-bold">Refresh</button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(form).filter(([key]) => key !== "isCurrent").map(([key, value]) => (
                key === "schoolClass" ? (
                  <select key={key} value={value} onChange={(event) => update(key, event.target.value)} className="rounded-xl border p-3 text-sm">
                    <option value="">Select class</option>
                    {classes.map((schoolClass) => <option key={schoolClass._id} value={schoolClass._id}>{schoolClass.name}{schoolClass.stream ? ` / ${schoolClass.stream}` : ""}</option>)}
                  </select>
                ) : key === "subject" ? (
                  <select key={key} value={value} onChange={(event) => update(key, event.target.value)} className="rounded-xl border p-3 text-sm">
                    <option value="">Select subject</option>
                    {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
                  </select>
                ) : (
                  <input key={key} type={key.toLowerCase().includes("date") || key.endsWith("at") ? "datetime-local" : ["amount", "quantity", "minimumStock", "unitCost", "fee"].includes(key) ? "number" : "text"} placeholder={key.replace(/([A-Z])/g, " $1")} value={Array.isArray(value) ? value.join(", ") : value} onChange={(event) => update(key, event.target.value)} className="rounded-xl border p-3 text-sm" />
                )
              ))}
            </div>

            {active === "academic-years" && <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isCurrent} onChange={(event) => update("isCurrent", event.target.checked)} /> Set as current academic year</label>}
            <button disabled={saving} onClick={() => void save()} className="mt-4 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-blue-950 disabled:opacity-60">{saving ? "Saving…" : "Add / Save"}</button>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Record</th><th className="p-3">Details</th><th className="p-3">Status</th></tr></thead>
                <tbody>
                  {list.slice(0, 100).map((record, index) => {
                    const label = record.name || record.title || record.topic || record.item?.name || record.schoolClass?.name || (record.date ? new Date(record.date).toLocaleDateString() : "Record");
                    const details = record.subject?.name || record.term || record.category || record.description || record.location || record.lunch || (record.amount != null ? `KES ${record.amount}` : "—");
                    const isActive = record.isActive !== false && record.status !== "inactive";
                    return <tr key={record._id || index} className="border-t"><td className="p-3 font-bold">{label}</td><td className="p-3 text-slate-600">{details}</td><td className="p-3 font-semibold">{isActive ? "Active" : "Inactive"}</td></tr>;
                  })}
                  {!list.length && !loading && <tr><td colSpan="3" className="p-8 text-center text-sm text-slate-500">No records yet. Use the form above to add the first one.</td></tr>}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </PortalShell>
  );
}
