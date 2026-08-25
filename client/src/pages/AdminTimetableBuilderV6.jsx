import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"], ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"]].map(([startTime, endTime], i) => ({ period: i + 1, startTime, endTime }));
const emptyLesson = () => ({ subject: "", lessonsPerWeek: 1 });
const teacherLabel = (teacher) => `${teacher?.name || [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || teacher?.email || "Teacher"}${teacher?.teacherCode ? ` · ${teacher.teacherCode}` : ""}`;
const classLabel = (item) => `${item?.name || "Class"}${item?.stream ? ` · ${item.stream}` : ""}`;

function Panel({ title, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-blue-950">{title}</h2></div><div className="p-5">{children}</div></section>;
}

export default function AdminTimetableBuilderV6() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [rows, setRows] = useState([]);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState("");
  const [lessons, setLessons] = useState([emptyLesson()]);
  const [allocationSubject, setAllocationSubject] = useState("");
  const [allocationTeachers, setAllocationTeachers] = useState([]);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });
  const [classForm, setClassForm] = useState({ name: "", stream: "", academicYear: String(new Date().getFullYear()), capacity: 40, classTeacher: "" });
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [cr, sr, tr, ar, tt, cfg] = await Promise.all([
        apiRequest(`/smis/classes`),
        apiRequest(`/smis/subjects`),
        apiRequest(`/smis/teachers`),
        apiRequest(`/smis/timetable/allocations?academicYear=${encodeURIComponent(academicYear)}`),
        apiRequest(`/smis/timetable?academicYear=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}`),
        apiRequest(`/smis/timetable/config?academicYear=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}`),
      ]);
      setClasses(cr?.classes || []); setSubjects(sr?.subjects || []); setTeachers(tr?.teachers || []); setAllocations(ar?.allocations || []);
      setRows(Array.isArray(tt?.data) ? tt.data : []); setPlans(cfg?.config?.classPlans || []);
      setPeriods(cfg?.config?.periods?.length ? cfg.config.periods : DEFAULT_PERIODS); setLocked(Boolean(cfg?.config?.locked));
    } catch (e) { setError(e.message || "Unable to load timetable centre."); } finally { setLoading(false); }
  }, [academicYear, term]);

  useEffect(() => { void load(); }, [load]);

  const activeClasses = useMemo(() => classes.filter((item) => item.isActive !== false && String(item.academicYear) === String(academicYear)), [classes, academicYear]);
  const subjectMap = useMemo(() => new Map(subjects.map((item) => [String(item._id), item])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((item) => [String(item._id), item])), [classes]);
  const allocationMap = useMemo(() => new Map(allocations.map((item) => [`${item.schoolClass?._id || item.schoolClass}:${item.subject?._id || item.subject}`, item])), [allocations]);
  const selectedAllocations = useMemo(() => allocations.filter((item) => String(item.schoolClass?._id || item.schoolClass) === String(selectedClass)), [allocations, selectedClass]);
  const plannedIds = useMemo(() => new Set(plans.map((item) => String(item.schoolClass))), [plans]);
  const readyCount = activeClasses.filter((item) => plannedIds.has(String(item._id))).length;
  const selectedClassSubjects = selectedAllocations.map((item) => item.subject).filter(Boolean);

  const fail = (message) => { setError(message); setNotice(""); };
  const ok = (message) => { setNotice(message); setError(""); };
  const allocationFor = (classId, subjectId) => allocationMap.get(`${classId}:${subjectId}`);
  const resetClassSelection = (id) => { setSelectedClass(id); setAllocationSubject(""); setAllocationTeachers([]); setLessons([emptyLesson()]); };

  const createClass = async (event) => {
    event.preventDefault();
    if (locked) return fail("Unlock the timetable before creating a class.");
    const name = classForm.name.trim(); const stream = classForm.stream.trim(); const year = classForm.academicYear.trim(); const capacity = Number(classForm.capacity);
    if (!name || !year || !Number.isInteger(capacity) || capacity < 1) return fail("Class name, academic year and a valid capacity are required.");
    setSaving(true);
    try {
      await apiRequest("/smis/classes", { method: "POST", body: JSON.stringify({ name, stream, academicYear: year, capacity, classTeacher: classForm.classTeacher || null }) });
      setClassForm({ name: "", stream: "", academicYear: year, capacity: 40, classTeacher: "" }); await load(); ok(`${name}${stream ? ` · ${stream}` : ""} created successfully.`);
    } catch (e) { fail(e.message || "Unable to create class."); } finally { setSaving(false); }
  };

  const createSubject = async (event) => {
    event.preventDefault();
    if (locked) return fail("Unlock the timetable before changing subjects.");
    setSaving(true);
    try {
      const name = subjectForm.name.trim(); const code = subjectForm.code.trim().toUpperCase();
      if (!name || !code) throw new Error("Subject name and code are required.");
      await apiRequest("/smis/subjects", { method: "POST", body: JSON.stringify({ name, code, description: subjectForm.description.trim() }) });
      setSubjectForm({ name: "", code: "", description: "" }); await load(); ok(`${name} created successfully.`);
    } catch (e) { fail(e.message || "Unable to create subject."); } finally { setSaving(false); }
  };

  const saveAllocation = async () => {
    if (locked) return fail("This timetable is locked. Unlock it before changing allocations.");
    if (!selectedClass || !allocationSubject) return fail("Select a class and subject first.");
    if (!allocationTeachers.length) return fail("Select at least one teacher.");
    setSaving(true);
    try {
      await apiRequest(`/smis/timetable/allocations/${selectedClass}/${allocationSubject}`, { method: "PATCH", body: JSON.stringify({ academicYear, teachers: allocationTeachers }) });
      await load(); ok("Class-specific subject teacher allocation saved.");
    } catch (e) { fail(e.message || "Unable to save allocation."); } finally { setSaving(false); }
  };

  const removeAllocation = async () => {
    if (!selectedClass || !allocationSubject) return fail("Select a class and subject first.");
    if (!window.confirm("Remove this allocation from the selected class subject?")) return;
    setSaving(true);
    try {
      await apiRequest(`/smis/timetable/allocations/${selectedClass}/${allocationSubject}?academicYear=${encodeURIComponent(academicYear)}`, { method: "DELETE" });
      await load(); setAllocationTeachers([]); ok("Class-specific teacher allocation removed.");
    } catch (e) { fail(e.message || "Unable to remove allocation."); } finally { setSaving(false); }
  };

  const savePlan = () => {
    if (locked) return fail("This timetable is locked. Unlock it before making changes.");
    if (!selectedClass) return fail("Select a class first.");
    const clean = lessons.map((lesson) => ({ subject: String(lesson.subject || ""), lessonsPerWeek: Number(lesson.lessonsPerWeek) }));
    if (clean.some((lesson) => !lesson.subject || !Number.isInteger(lesson.lessonsPerWeek) || lesson.lessonsPerWeek < 1)) return fail("Every lesson plan row needs a subject and lessons per week greater than zero.");
    const seen = new Set();
    for (const lesson of clean) {
      if (seen.has(lesson.subject)) return fail("Each subject may appear only once in a class plan.");
      seen.add(lesson.subject);
      if (!allocationFor(selectedClass, lesson.subject)?.teachers?.length) return fail(`${subjectMap.get(lesson.subject)?.name || "The selected subject"} has no teacher allocation for this class.`);
    }
    const total = clean.reduce((sum, lesson) => sum + lesson.lessonsPerWeek, 0);
    if (total > periods.length * DAYS.length) return fail(`${classLabel(classMap.get(selectedClass))} requires ${total} lessons but only ${periods.length * DAYS.length} weekly slots exist.`);
    setPlans((current) => [...current.filter((plan) => String(plan.schoolClass) !== String(selectedClass)), { schoolClass: selectedClass, lessons: clean }]);
    setSelectedClass(""); setLessons([emptyLesson()]); ok("Class lesson plan saved. Teachers will be selected automatically from the class-specific allocations.");
  };

  const editPlan = (id) => {
    const plan = plans.find((item) => String(item.schoolClass) === String(id)); if (!plan) return;
    setSelectedClass(String(id)); setLessons(plan.lessons.map((lesson) => ({ subject: String(lesson.subject), lessonsPerWeek: Number(lesson.lessonsPerWeek) })));
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const addLesson = () => setLessons((current) => [...current, emptyLesson()]);
  const removeLesson = (index) => setLessons((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));
  const addPeriod = () => setPeriods((current) => { const last = current[current.length - 1] || { endTime: "15:20" }; const [h, m] = last.endTime.split(":").map(Number); const start = h * 60 + m + 40; const end = start + 40; const fmt = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; return [...current, { period: current.length + 1, startTime: fmt(start), endTime: fmt(end) }]; });
  const deletePeriod = (index) => { if (locked) return fail("Unlock the timetable before deleting periods."); if (periods.length <= 1) return fail("At least one school period is required."); setPeriods((current) => current.filter((_, i) => i !== index).map((period, i) => ({ ...period, period: i + 1 }))); };

  const generate = async () => {
    if (locked) return fail("This timetable is locked. Unlock it before regenerating.");
    if (!activeClasses.length) return fail(`No active classes exist for ${academicYear}. Create your classes first.`);
    if (readyCount !== activeClasses.length) return fail(`Complete every active class lesson plan first (${readyCount}/${activeClasses.length} ready).`);
    if (rows.length && !window.confirm(`A ${academicYear} ${term} timetable already exists. Replace the existing timetable?`)) return;
    const invalid = periods.find((period) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.endTime) || period.startTime >= period.endTime);
    if (invalid) return fail("Every school period must have valid start and end times.");
    const slots = DAYS.flatMap((_, day) => periods.map((period) => ({ dayOfWeek: day + 1, period: period.period, startTime: period.startTime, endTime: period.endTime })));
    setSaving(true);
    try {
      const result = await apiRequest("/smis/timetable/generate", { method: "POST", body: JSON.stringify({ academicYear, term, classes: plans, slots, replaceExisting: Boolean(rows.length) }) });
      setRows(result?.data || []); await load(); ok(result?.message || `Generated ${result?.count || 0} lessons.`);
    } catch (e) { fail(e.message || "Unable to generate timetable."); } finally { setSaving(false); }
  };

  const lock = async () => { setSaving(true); try { await apiRequest("/smis/timetable/lock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); ok("Timetable locked. Editing and deletion are now disabled."); } catch (e) { fail(e.message || "Unable to lock timetable."); } finally { setSaving(false); } };
  const unlock = async () => { setSaving(true); try { await apiRequest("/smis/timetable/unlock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); ok("Timetable unlocked."); } catch (e) { fail(e.message || "Unable to unlock timetable."); } finally { setSaving(false); } };

  if (loading) return <main className="p-6"><div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading academic scheduling centre…</div></main>;

  return <main className="space-y-6 p-6">
    <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Angels Home SMIS</p><h1 className="text-2xl font-black text-blue-950">Academic Scheduling Centre</h1><p className="text-sm text-slate-500">Classes → Subjects → Class-specific teacher allocations → Weekly lesson counts → School periods → Whole-school generation.</p></div><Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold">Back to SMIS</Link></header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}

    <Panel title="1. Create classes"><form onSubmit={createClass} className="grid gap-3 md:grid-cols-2 lg:grid-cols-5"><input required value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Class name e.g. Grade 4" className="rounded-xl border p-3"/><input value={classForm.stream} onChange={(e) => setClassForm({ ...classForm, stream: e.target.value })} placeholder="Stream e.g. A" className="rounded-xl border p-3"/><input required value={classForm.academicYear} onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })} placeholder="Academic year" className="rounded-xl border p-3"/><input required type="number" min="1" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })} placeholder="Capacity" className="rounded-xl border p-3"/><select value={classForm.classTeacher} onChange={(e) => setClassForm({ ...classForm, classTeacher: e.target.value })} className="rounded-xl border p-3"><option value="">Class teacher (optional)</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacherLabel(teacher)}</option>)}</select><button disabled={saving || locked} className="rounded-xl bg-blue-950 p-3 font-black text-white md:col-span-2 lg:col-span-5">Create class</button></form><div className="mt-4 flex flex-wrap gap-2">{activeClasses.map((item) => <span key={item._id} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{classLabel(item)}</span>)}{!activeClasses.length && <span className="text-sm text-amber-700">No classes exist for the selected academic year yet.</span>}</div></Panel>

    <Panel title="2. Create subjects"><form onSubmit={createSubject} className="grid gap-3 md:grid-cols-4"><input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name" className="rounded-xl border p-3"/><input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="Code e.g. MATH" className="rounded-xl border p-3"/><input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Description" className="rounded-xl border p-3"/><button disabled={saving || locked} className="rounded-xl bg-blue-950 p-3 font-black text-white">Create subject</button></form><div className="mt-4 flex flex-wrap gap-2">{subjects.map((subject) => <span key={subject._id} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-900">{subject.name} ({subject.code})</span>)}</div></Panel>

    <Panel title="3. Allocate teachers for each class subject"><div className="grid gap-4 lg:grid-cols-4"><select value={selectedClass} onChange={(e) => resetClassSelection(e.target.value)} className="rounded-xl border p-3"><option value="">Select class</option>{activeClasses.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}</option>)}</select><select value={allocationSubject} onChange={(e) => { const value = e.target.value; setAllocationSubject(value); const allocation = allocationFor(selectedClass, value); setAllocationTeachers((allocation?.teachers || []).map((teacher) => String(teacher?._id || teacher))); }} disabled={!selectedClass} className="rounded-xl border p-3"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}</select><select multiple value={allocationTeachers} onChange={(e) => setAllocationTeachers([...e.target.selectedOptions].map((option) => option.value))} disabled={!allocationSubject || locked} className="min-h-36 rounded-xl border p-3">{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacherLabel(teacher)}</option>)}</select><div className="flex flex-col gap-2"><button type="button" disabled={saving || locked} onClick={saveAllocation} className="rounded-xl bg-amber-400 p-3 font-black text-blue-950">Save allocation</button><button type="button" disabled={saving || locked || !allocationSubject} onClick={removeAllocation} className="rounded-xl border p-3 font-bold text-red-600">Remove allocation</button></div></div><p className="mt-3 text-xs text-slate-500">Choose a class first, then a subject, then one or more teachers. The generator balances lessons across the allocated teachers and prevents teacher collisions.</p>{selectedClass && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{selectedAllocations.map((item) => <div key={item._id} className="rounded-xl border bg-slate-50 p-3 text-sm"><b>{item.subject?.name || "Subject"}</b><div className="text-slate-500">{(item.teachers || []).map(teacherLabel).join(", ")}</div></div>)}</div>}</Panel>

    <Panel title="4. School periods"><div className="space-y-2">{periods.map((period, index) => <div key={period.period} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[100px_1fr_1fr_auto]"><b>Period {period.period}</b><input type="time" disabled={locked} value={period.startTime} onChange={(e) => setPeriods((current) => current.map((item, i) => i === index ? { ...item, startTime: e.target.value } : item))} className="rounded-lg border p-2"/><input type="time" disabled={locked} value={period.endTime} onChange={(e) => setPeriods((current) => current.map((item, i) => i === index ? { ...item, endTime: e.target.value } : item))} className="rounded-lg border p-2"/><button type="button" disabled={locked} onClick={() => deletePeriod(index)} className="rounded-lg border px-3 py-2 font-bold text-red-600">Delete</button></div>)}<button type="button" disabled={locked} onClick={addPeriod} className="rounded-xl border px-4 py-2 font-bold">+ Add period</button></div></Panel>

    <Panel title="5. Build each class lesson plan"><div className="grid gap-3 md:grid-cols-3"><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value.trim())} className="rounded-xl border p-3" placeholder="Academic year"/><select value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-xl border p-3"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select><select value={selectedClass} onChange={(e) => resetClassSelection(e.target.value)} className="rounded-xl border p-3"><option value="">Select class</option>{activeClasses.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}</option>)}</select></div>{selectedClass && <div className="mt-4 space-y-3">{lessons.map((lesson, index) => { const allocation = allocationFor(selectedClass, lesson.subject); return <div key={`${index}-${lesson.subject}`} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr_180px_auto]"><select value={lesson.subject} onChange={(e) => setLessons((current) => current.map((item, i) => i === index ? { ...item, subject: e.target.value } : item))} className="rounded-lg border p-2"><option value="">Select allocated subject</option>{selectedClassSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}</select><input type="number" min="1" step="1" value={lesson.lessonsPerWeek} onChange={(e) => setLessons((current) => current.map((item, i) => i === index ? { ...item, lessonsPerWeek: e.target.value } : item))} className="rounded-lg border p-2"/><button type="button" disabled={lessons.length === 1} onClick={() => removeLesson(index)} className="rounded-lg border px-3 py-2 font-bold text-red-600 disabled:opacity-40">Remove</button><p className="text-xs text-slate-500 md:col-span-3">{allocation?.teachers?.length ? `Allocated teacher(s): ${(allocation.teachers || []).map(teacherLabel).join(", ")}. Teacher selection is automatic.` : "Allocate a teacher for this class subject first."}</p></div>; })}<div className="flex flex-wrap gap-2"><button type="button" onClick={addLesson} className="rounded-xl border px-4 py-2 font-bold">+ Add subject</button><button type="button" disabled={saving || locked} onClick={savePlan} className="rounded-xl bg-blue-950 px-4 py-2 font-black text-white">Save class plan</button></div></div>}{!selectedClass && <p className="mt-4 text-sm text-slate-500">Select a class to build its weekly subject plan. Only subjects already allocated to that class appear here.</p>}</Panel>

    <Panel title="6. Saved class plans"><div className="space-y-2">{plans.map((plan) => <div key={String(plan.schoolClass)} className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center"><div><b>{classLabel(classMap.get(String(plan.schoolClass)))}</b><div className="mt-1 text-sm text-slate-500">{(plan.lessons || []).map((lesson) => `${subjectMap.get(String(lesson.subject))?.name || "Subject"}: ${lesson.lessonsPerWeek}/week`).join(" · ")}</div></div><button type="button" onClick={() => editPlan(plan.schoolClass)} disabled={locked} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-40">Edit plan</button></div>)}{!plans.length && <p className="text-sm text-slate-500">No class plans saved yet.</p>}</div></Panel>

    <Panel title="7. Generate and lock whole-school timetable"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-slate-100 px-4 py-2 font-bold">{readyCount}/{activeClasses.length} classes ready</span>{locked ? <button type="button" disabled={saving} onClick={unlock} className="rounded-xl bg-amber-400 px-4 py-3 font-black text-blue-950">Unlock timetable</button> : <><button type="button" disabled={saving} onClick={generate} className="rounded-xl bg-blue-950 px-4 py-3 font-black text-white">{saving ? "Generating…" : "Generate whole-school timetable"}</button>{rows.length > 0 && <button type="button" disabled={saving} onClick={lock} className="rounded-xl bg-emerald-600 px-4 py-3 font-black text-white">Lock timetable</button>}</>}</div><p className="mt-3 text-sm text-slate-500">Generation uses every active class together. It validates allocations, weekly workload, school capacity and teacher/class collisions before saving.</p></Panel>

    <Panel title="Whole-school timetable"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Time</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id} className="border-b"><td className="p-3">{DAYS[(Number(row.dayOfWeek) || 1) - 1] || row.dayOfWeek}</td><td className="p-3">{row.period}</td><td className="p-3 font-bold">{classLabel(row.schoolClass)}</td><td className="p-3">{row.subject?.name || "—"}</td><td className="p-3">{teacherLabel(row.teacher)}</td><td className="p-3">{row.startTime}–{row.endTime}</td></tr>)}</tbody></table>{!rows.length && <p className="p-6 text-center text-sm text-slate-500">No timetable has been generated for {academicYear}, {term}.</p>}</div></Panel>
  </main>;
}
