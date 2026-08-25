import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  ["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"],
  ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"],
].map(([startTime, endTime], i) => ({ period: i + 1, startTime, endTime }));
const emptyLesson = () => ({ subject: "", teacher: "", lessonsPerWeek: 1 });
const teacherLabel = (t) => t?.name || [t?.firstName, t?.lastName].filter(Boolean).join(" ") || t?.email || "Teacher";
const classLabel = (c) => `${c?.name || "Class"}${c?.stream ? ` · ${c.stream}` : ""}`;

function Panel({ title, children }) { return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-blue-950">{title}</h2></div><div className="p-5">{children}</div></section>; }

export default function AdminTimetableBuilderV5() {
  const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([]); const [teachers, setTeachers] = useState([]); const [allocations, setAllocations] = useState([]);
  const [plans, setPlans] = useState([]); const [rows, setRows] = useState([]); const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear())); const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState(""); const [lessons, setLessons] = useState([emptyLesson()]); const [allocationSubject, setAllocationSubject] = useState(""); const [allocationTeachers, setAllocationTeachers] = useState([]);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" }); const [locked, setLocked] = useState(false); const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [cr, sr, tr, ar, tt, cfg] = await Promise.all([
        apiRequest("/smis/classes"), apiRequest("/smis/subjects"), apiRequest("/smis/teachers"),
        apiRequest(`/smis/timetable/allocations?academicYear=${encodeURIComponent(academicYear)}`),
        apiRequest(`/smis/timetable?academicYear=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}`),
        apiRequest(`/smis/timetable/config?academicYear=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}`),
      ]);
      setClasses(cr?.classes || []); setSubjects(sr?.subjects || []); setTeachers(tr?.teachers || []); setAllocations(ar?.allocations || []);
      setRows(Array.isArray(tt?.data) ? tt.data : []); setPlans(cfg?.config?.classPlans || []); setPeriods(cfg?.config?.periods?.length ? cfg.config.periods : DEFAULT_PERIODS); setLocked(Boolean(cfg?.config?.locked));
    } catch (e) { setError(e.message || "Unable to load timetable centre."); } finally { setLoading(false); }
  }, [academicYear, term]);
  useEffect(() => { void load(); }, [load]);

  const activeClasses = useMemo(() => classes.filter((c) => c.isActive !== false && (!c.academicYear || String(c.academicYear) === academicYear)), [classes, academicYear]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [String(s._id), s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [String(c._id), c])), [classes]);
  const allocationMap = useMemo(() => new Map(allocations.map((a) => [`${a.schoolClass?._id || a.schoolClass}:${a.subject?._id || a.subject}`, a])), [allocations]);
  const selectedClassAllocations = useMemo(() => allocations.filter((a) => String(a.schoolClass?._id || a.schoolClass) === String(selectedClass)), [allocations, selectedClass]);
  const plannedIds = useMemo(() => new Set(plans.map((p) => String(p.schoolClass))), [plans]);
  const readyCount = activeClasses.filter((c) => plannedIds.has(String(c._id))).length;

  const fail = (message) => { setError(message); setNotice(""); }; const ok = (message) => { setNotice(message); setError(""); };
  const allocationFor = (classId, subjectId) => allocationMap.get(`${classId}:${subjectId}`);

  const updateLesson = (index, field, value) => setLessons((current) => current.map((l, i) => i === index ? { ...l, [field]: value, ...(field === "subject" ? { teacher: "" } : {}) } : l));
  const addLesson = () => setLessons((current) => [...current, emptyLesson()]);
  const removeLesson = (index) => setLessons((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));

  const saveAllocation = async () => {
    if (locked) return fail("This timetable is locked. Unlock it before changing allocations.");
    if (!selectedClass || !allocationSubject) return fail("Select a class and subject first.");
    if (!allocationTeachers.length) return fail("Select at least one teacher.");
    setSaving(true);
    try { await apiRequest(`/smis/timetable/allocations/${selectedClass}/${allocationSubject}`, { method: "PATCH", body: JSON.stringify({ academicYear, teachers: allocationTeachers }) }); await load(); ok("Class subject teacher allocation saved."); }
    catch (e) { fail(e.message || "Unable to save class subject allocation."); } finally { setSaving(false); }
  };

  const removeAllocation = async () => {
    if (!selectedClass || !allocationSubject) return;
    if (!window.confirm("Remove this teacher allocation from the selected class and subject?")) return;
    setSaving(true);
    try { await apiRequest(`/smis/timetable/allocations/${selectedClass}/${allocationSubject}?academicYear=${encodeURIComponent(academicYear)}`, { method: "DELETE" }); await load(); setAllocationTeachers([]); ok("Class subject allocation removed."); }
    catch (e) { fail(e.message || "Unable to remove allocation."); } finally { setSaving(false); }
  };

  const onAllocationSubjectChange = (subjectId) => { setAllocationSubject(subjectId); const a = allocationFor(selectedClass, subjectId); setAllocationTeachers((a?.teachers || []).map((t) => String(t?._id || t))); };
  const onClassChange = (classId) => { setSelectedClass(classId); setAllocationSubject(""); setAllocationTeachers([]); setLessons([emptyLesson()]); };

  const savePlan = () => {
    if (locked) return fail("This timetable is locked. Unlock it before making changes.");
    if (!selectedClass) return fail("Select a class first.");
    const clean = lessons.map((l) => ({ subject: String(l.subject || ""), teacher: String(l.teacher || ""), lessonsPerWeek: Number(l.lessonsPerWeek) }));
    if (clean.some((l) => !l.subject || !l.teacher || !Number.isInteger(l.lessonsPerWeek) || l.lessonsPerWeek < 1)) return fail("Every lesson needs a subject, an allocated teacher and a weekly count greater than zero.");
    const seen = new Set();
    for (const lesson of clean) {
      if (seen.has(lesson.subject)) return fail("Each subject may appear only once in a class plan."); seen.add(lesson.subject);
      const subject = subjectMap.get(lesson.subject); const allocation = allocationFor(selectedClass, lesson.subject);
      if (!subject || !allocation?.teachers?.length) return fail(`${subject?.name || "This subject"} has no teacher allocation for the selected class.`);
      if (!allocation.teachers.some((t) => String(t?._id || t) === lesson.teacher)) return fail(`${subject.name} is not allocated to the selected teacher for this class.`);
    }
    const total = clean.reduce((sum, l) => sum + l.lessonsPerWeek, 0); if (total > periods.length * DAYS.length) return fail(`${classLabel(classMap.get(selectedClass))} requires ${total} lessons but only ${periods.length * DAYS.length} weekly slots exist.`);
    setPlans((current) => [...current.filter((p) => String(p.schoolClass) !== selectedClass), { schoolClass: selectedClass, lessons: clean }]); setSelectedClass(""); setLessons([emptyLesson()]); ok("Complete class lesson plan saved.");
  };
  const editPlan = (id) => { const plan = plans.find((p) => String(p.schoolClass) === String(id)); if (!plan) return; setSelectedClass(String(id)); setLessons(plan.lessons.map((l) => ({ ...l }))); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); };

  const createSubject = async (event) => {
    event.preventDefault(); if (locked) return fail("Unlock the timetable before changing subjects."); setSaving(true);
    try { const name = subjectForm.name.trim(); const code = subjectForm.code.trim().toUpperCase(); if (!name || !code) throw new Error("Subject name and code are required."); await apiRequest("/smis/subjects", { method: "POST", body: JSON.stringify({ name, code, description: subjectForm.description.trim() }) }); setSubjectForm({ name: "", code: "", description: "" }); await load(); ok(`${name} created.`); }
    catch (e) { fail(e.message || "Unable to create subject."); } finally { setSaving(false); }
  };

  const updatePeriod = (index, field, value) => setPeriods((current) => current.map((p, i) => i === index ? { ...p, [field]: value } : p));
  const addPeriod = () => setPeriods((current) => { const last = current[current.length - 1] || { endTime: "15:20" }; const [h, m] = last.endTime.split(":").map(Number); const startMin = h * 60 + m + 40; const endMin = startMin + 40; const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`; return [...current, { period: current.length + 1, startTime: fmt(startMin), endTime: fmt(endMin) }]; });
  const deletePeriod = (index) => { if (locked) return fail("Unlock the timetable before deleting periods."); if (periods.length <= 1) return fail("At least one period is required."); setPeriods((current) => current.filter((_, i) => i !== index).map((p, i) => ({ ...p, period: i + 1 }))); };

  const generate = async () => {
    if (locked) return fail("This timetable is locked. Unlock it before regenerating.");
    if (activeClasses.length === 0) return fail("Create at least one active class before generating.");
    if (plans.length !== activeClasses.length) return fail(`Complete every active class plan first (${readyCount}/${activeClasses.length} ready).`);
    for (const plan of plans) { for (const lesson of plan.lessons) if (!allocationFor(plan.schoolClass, lesson.subject)?.teachers?.some((t) => String(t?._id || t) === String(lesson.teacher))) return fail("A class plan contains a teacher who is no longer allocated to that class subject. Review allocations first."); }
    if (rows.length && !window.confirm(`A ${academicYear} ${term} timetable already exists. Replace the existing timetable?`)) return;
    const invalid = periods.find((p) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.endTime) || p.startTime >= p.endTime); if (invalid) return fail("Every school period must have valid start and end times.");
    const slots = DAYS.flatMap((_, day) => periods.map((p) => ({ dayOfWeek: day + 1, period: p.period, startTime: p.startTime, endTime: p.endTime })));
    setSaving(true);
    try { const result = await apiRequest("/smis/timetable/generate", { method: "POST", body: JSON.stringify({ academicYear, term, classes: plans, slots, replaceExisting: Boolean(rows.length) }) }); setRows(result?.data || []); await load(); ok(result?.message || `Generated ${result?.count || 0} lessons.`); }
    catch (e) { fail(e.message || "Unable to generate timetable."); } finally { setSaving(false); }
  };
  const lock = async () => { setSaving(true); try { await apiRequest("/smis/timetable/lock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); ok("Timetable locked. Only an admin can unlock it."); } catch (e) { fail(e.message || "Unable to lock timetable."); } finally { setSaving(false); } };
  const unlock = async () => { setSaving(true); try { await apiRequest("/smis/timetable/unlock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); ok("Timetable unlocked."); } catch (e) { fail(e.message || "Unable to unlock timetable."); } finally { setSaving(false); } };

  if (loading) return <main className="p-6"><div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading academic scheduling centre…</div></main>;
  return <main className="space-y-6 p-6">
    <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Angels Home SMIS</p><h1 className="text-2xl font-black text-blue-950">Academic Scheduling Centre</h1><p className="text-sm text-slate-500">Classes → Subjects → Class teacher allocations → Weekly lesson counts → School periods → Whole-school generation.</p></div><Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold">Back to SMIS</Link></header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}

    <Panel title="1. Create subjects"><form onSubmit={createSubject} className="grid gap-3 md:grid-cols-4"><input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name" className="rounded-xl border p-3"/><input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="Code" className="rounded-xl border p-3"/><input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Description" className="rounded-xl border p-3"/><button disabled={saving || locked} className="rounded-xl bg-blue-950 p-3 font-black text-white disabled:opacity-50">Create subject</button></form></Panel>

    <Panel title="2. Allocate subject teachers for each class"><div className="grid gap-4 lg:grid-cols-4"><select value={selectedClass} onChange={(e) => onClassChange(e.target.value)} className="rounded-xl border p-3"><option value="">Select class</option>{activeClasses.map((c) => <option key={c._id} value={c._id}>{classLabel(c)}</option>)}</select><select value={allocationSubject} onChange={(e) => onAllocationSubjectChange(e.target.value)} disabled={!selectedClass} className="rounded-xl border p-3"><option value="">Select subject</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}</select><select multiple value={allocationTeachers} onChange={(e) => setAllocationTeachers([...e.target.selectedOptions].map((o) => o.value))} disabled={!allocationSubject || locked} className="min-h-32 rounded-xl border p-3">{teachers.map((t) => <option key={t._id} value={t._id}>{teacherLabel(t)}</option>)}</select><div className="flex flex-col gap-2"><button type="button" disabled={saving || locked || !selectedClass || !allocationSubject} onClick={saveAllocation} className="rounded-xl bg-amber-400 p-3 font-black text-blue-950">Save allocation</button><button type="button" disabled={saving || locked || !selectedClass || !allocationSubject} onClick={removeAllocation} className="rounded-xl border p-3 font-bold text-red-600">Remove allocation</button></div></div><p className="mt-3 text-xs text-slate-500">Allocations are class-specific. A teacher must first be globally allocated to the subject, then explicitly allocated to each class before that subject can enter the class timetable plan.</p>{selectedClass && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{selectedClassAllocations.map((a) => <div key={a._id} className="rounded-xl border bg-slate-50 p-3 text-sm"><b>{a.subject?.name}</b><div className="text-slate-500">{(a.teachers || []).map(teacherLabel).join(", ")}</div></div>)}</div>}</Panel>

    <Panel title="3. School periods"><div className="space-y-2">{periods.map((p, i) => <div key={p.period} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[100px_1fr_1fr_auto]"><b>Period {p.period}</b><input type="time" disabled={locked} value={p.startTime} onChange={(e) => updatePeriod(i, "startTime", e.target.value)} className="rounded-lg border p-2 disabled:bg-slate-100"/><input type="time" disabled={locked} value={p.endTime} onChange={(e) => updatePeriod(i, "endTime", e.target.value)} className="rounded-lg border p-2 disabled:bg-slate-100"/><button type="button" disabled={locked} onClick={() => deletePeriod(i)} className="rounded-lg border px-3 py-2 font-bold text-red-600 disabled:opacity-40">Delete</button></div>)}<button type="button" disabled={locked} onClick={addPeriod} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-40">+ Add period</button></div></Panel>

    <Panel title="4. Build each class lesson plan"><div className="grid gap-4"><div className="grid gap-3 md:grid-cols-3"><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value.trim())} className="rounded-xl border p-3" placeholder="Academic year"/><select value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-xl border p-3"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select><select value={selectedClass} onChange={(e) => onClassChange(e.target.value)} className="rounded-xl border p-3"><option value="">Select class</option>{activeClasses.map((c) => <option key={c._id} value={c._id}>{classLabel(c)}</option>)}</select></div>{selectedClass && <div className="space-y-3">{lessons.map((lesson, i) => { const allocation = allocationFor(selectedClass, lesson.subject); const allocatedTeachers = allocation?.teachers || []; return <div key={`${i}-${lesson.subject}`} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1.4fr_1.4fr_160px_auto]"><select value={lesson.subject} onChange={(e) => updateLesson(i, "subject", e.target.value)} className="rounded-lg border p-2"><option value="">Subject</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}</select><select value={lesson.teacher} onChange={(e) => updateLesson(i, "teacher", e.target.value)} disabled={!allocatedTeachers.length} className="rounded-lg border p-2"><option value="">{allocatedTeachers.length ? "Select allocated teacher" : "Allocate teacher first"}</option>{allocatedTeachers.map((t) => <option key={t._id || t} value={t._id || t}>{teacherLabel(t)}</option>)}</select><input type="number" min="1" max={periods.length * DAYS.length} value={lesson.lessonsPerWeek} onChange={(e) => updateLesson(i, "lessonsPerWeek", e.target.value)} className="rounded-lg border p-2"/><button type="button" onClick={() => removeLesson(i)} disabled={lessons.length === 1} className="rounded-lg border px-3 py-2 font-bold text-red-600 disabled:opacity-40">Remove</button></div>; })}<div className="flex flex-wrap gap-2"><button type="button" onClick={addLesson} className="rounded-xl border px-4 py-2 font-bold">+ Add subject</button><button type="button" disabled={locked} onClick={savePlan} className="rounded-xl bg-blue-950 px-4 py-2 font-black text-white disabled:opacity-50">Save class plan</button></div></div>}<div className="rounded-xl bg-slate-50 p-4 text-sm"><b>{readyCount}/{activeClasses.length} classes ready.</b> Every active class must have a complete plan before generation.</div></div></Panel>

    <Panel title="5. Saved class plans"><div className="grid gap-2 md:grid-cols-2">{activeClasses.map((c) => { const p = plans.find((x) => String(x.schoolClass) === String(c._id)); return <div key={c._id} className="rounded-xl border p-3"><div className="flex items-center justify-between gap-2"><b>{classLabel(c)}</b>{p ? <button type="button" onClick={() => editPlan(c._id)} className="text-sm font-bold text-blue-700">Edit</button> : <span className="text-sm text-red-600">Incomplete</span>}</div>{p && <div className="mt-2 text-xs text-slate-600">{p.lessons.map((l) => `${subjectMap.get(String(l.subject))?.name || "Subject"} · ${l.lessonsPerWeek}/week`).join(" · ")}</div>}</div>; })}</div></Panel>

    <Panel title="6. Generate and lock whole-school timetable"><div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving || locked || readyCount !== activeClasses.length} onClick={generate} className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-50">Generate whole-school timetable ({readyCount}/{activeClasses.length})</button>{rows.length > 0 && !locked && <button type="button" disabled={saving} onClick={lock} className="rounded-xl bg-blue-950 px-5 py-3 font-black text-white">Lock timetable</button>}{locked && <button type="button" disabled={saving} onClick={unlock} className="rounded-xl border px-5 py-3 font-black text-red-700">Unlock timetable</button>}<span className="text-sm font-bold text-slate-600">{locked ? "Locked" : "Editable"}</span></div><p className="mt-3 text-xs text-slate-500">Generation validates class workload, teacher workload, class-specific allocations and collision-free placement. Existing timetables require explicit replacement confirmation.</p></Panel>

    <Panel title="Whole-school timetable"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-2">Day</th><th className="p-2">Period</th><th className="p-2">Class</th><th className="p-2">Subject</th><th className="p-2">Teacher</th><th className="p-2">Time</th></tr></thead><tbody>{rows.map((r) => <tr key={r._id} className="border-b"><td className="p-2">{DAYS[(Number(r.dayOfWeek) || 1) - 1] || r.dayOfWeek}</td><td className="p-2">{r.period}</td><td className="p-2">{classLabel(r.schoolClass)}</td><td className="p-2">{r.subject?.name || "—"}</td><td className="p-2">{teacherLabel(r.teacher)}</td><td className="p-2">{r.startTime}–{r.endTime}</td></tr>)}</tbody></table>{!rows.length && <p className="py-8 text-center text-slate-500">No timetable has been generated for {academicYear}, {term}.</p>}</div></Panel>
  </main>;
}
