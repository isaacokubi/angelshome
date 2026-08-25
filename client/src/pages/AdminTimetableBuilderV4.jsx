import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  ["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"],
  ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"],
].map(([startTime, endTime], index) => ({ period: index + 1, startTime, endTime }));

const emptyLesson = () => ({ subject: "", teacher: "", lessonsPerWeek: 1 });
const labelClass = (item) => `${item?.name || "Unknown class"}${item?.stream ? ` · ${item.stream}` : ""}`;
const labelTeacher = (item) => `${item?.name || [item?.firstName, item?.lastName].filter(Boolean).join(" ") || item?.email || "Unknown teacher"}${item?.teacherCode ? ` · ${item.teacherCode}` : ""}`;

function Panel({ title, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-blue-950">{title}</h2></div><div className="p-5">{children}</div></section>;
}

export default function AdminTimetableBuilderV4() {
  const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([]); const [teachers, setTeachers] = useState([]);
  const [plans, setPlans] = useState([]); const [rows, setRows] = useState([]); const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear())); const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState(""); const [lessons, setLessons] = useState([emptyLesson()]);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" }); const [allocationSubject, setAllocationSubject] = useState(""); const [allocationTeachers, setAllocationTeachers] = useState([]);
  const [locked, setLocked] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [classResult, subjectResult, teacherResult, timetableResult, configResult] = await Promise.all([
        apiRequest("/smis/classes"), apiRequest("/smis/subjects"), apiRequest("/smis/teachers"),
        apiRequest(`/smis/timetable?academicYear=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}`),
        apiRequest(`/smis/timetable/config?academicYear=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}`),
      ]);
      setClasses(classResult?.classes || []); setSubjects(subjectResult?.subjects || []); setTeachers(teacherResult?.teachers || []);
      setRows(Array.isArray(timetableResult?.data) ? timetableResult.data : []);
      setPlans(configResult?.config?.classPlans || []); setPeriods(configResult?.config?.periods?.length ? configResult.config.periods : DEFAULT_PERIODS);
      setLocked(Boolean(configResult?.config?.locked));
    } catch (e) { setError(e.message || "Unable to load timetable configuration."); } finally { setLoading(false); }
  }, [academicYear, term]);

  useEffect(() => { void load(); }, [load]);

  const activeClasses = useMemo(() => classes.filter((item) => item.isActive !== false && (!item.academicYear || String(item.academicYear) === academicYear)), [classes, academicYear]);
  const classMap = useMemo(() => new Map(classes.map((item) => [String(item._id), item])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((item) => [String(item._id), item])), [subjects]);
  const selectedSubject = subjectMap.get(String(allocationSubject));
  const plannedIds = useMemo(() => new Set(plans.map((plan) => String(plan.schoolClass))), [plans]);

  const showError = (text) => { setError(text); setNotice(""); };
  const showNotice = (text) => { setNotice(text); setError(""); };

  const updateLesson = (index, field, value) => setLessons((current) => current.map((item, i) => i === index ? { ...item, [field]: value, ...(field === "subject" ? { teacher: "" } : {}) } : item));
  const addLesson = () => setLessons((current) => [...current, emptyLesson()]);
  const removeLesson = (index) => setLessons((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));

  const saveClassPlan = () => {
    if (locked) return showError("This timetable is locked. Unlock it before making changes.");
    if (!selectedClass) return showError("Select a class first.");
    const clean = lessons.map((lesson) => ({ subject: String(lesson.subject || ""), teacher: String(lesson.teacher || ""), lessonsPerWeek: Number(lesson.lessonsPerWeek) }));
    if (clean.some((lesson) => !lesson.subject || !lesson.teacher || !Number.isInteger(lesson.lessonsPerWeek) || lesson.lessonsPerWeek < 1)) return showError("Every class lesson must have a subject, an allocated teacher and lessons per week greater than zero.");
    const seenSubjects = new Set();
    for (const lesson of clean) {
      if (seenSubjects.has(lesson.subject)) return showError("A subject may appear only once in a class plan.");
      seenSubjects.add(lesson.subject);
      const subject = subjectMap.get(lesson.subject);
      if (!subject) return showError("A selected subject is no longer active.");
      const allocated = (subject.teachers || []).some((teacher) => String(teacher?._id || teacher) === lesson.teacher);
      if (!allocated) return showError(`${subject.name} is not allocated to the selected teacher.`);
    }
    const total = clean.reduce((sum, lesson) => sum + lesson.lessonsPerWeek, 0);
    if (total > periods.length * DAYS.length) return showError(`${labelClass(classMap.get(String(selectedClass)))} requires ${total} lessons but the school has only ${periods.length * DAYS.length} weekly slots.`);
    setPlans((current) => [...current.filter((plan) => String(plan.schoolClass) !== String(selectedClass)), { schoolClass: selectedClass, lessons: clean }]);
    setSelectedClass(""); setLessons([emptyLesson()]); showNotice("Class-specific subject, teacher and weekly lesson allocation saved.");
  };

  const editPlan = (id) => { const plan = plans.find((item) => String(item.schoolClass) === String(id)); if (!plan) return; setSelectedClass(String(id)); setLessons(plan.lessons.map((lesson) => ({ ...lesson }))); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); };

  const createSubject = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const name = subjectForm.name.trim(); const code = subjectForm.code.trim().toUpperCase(); if (!name || !code) throw new Error("Subject name and code are required.");
      await apiRequest("/smis/subjects", { method: "POST", body: JSON.stringify({ name, code, description: subjectForm.description.trim() }) });
      setSubjectForm({ name: "", code: "", description: "" }); await load(); showNotice(`${name} created successfully.`);
    } catch (e) { showError(e.message || "Unable to create subject."); } finally { setSaving(false); }
  };

  const saveAllocation = async () => {
    if (!allocationSubject) return showError("Select a subject first.");
    if (!allocationTeachers.length) return showError("Select at least one teacher for this subject.");
    setSaving(true);
    try { await apiRequest(`/smis/subjects/${allocationSubject}/teachers`, { method: "PATCH", body: JSON.stringify({ teachers: allocationTeachers }) }); await load(); showNotice("Subject teacher allocation saved."); }
    catch (e) { showError(e.message || "Unable to save subject teacher allocation."); } finally { setSaving(false); }
  };

  const updatePeriod = (index, field, value) => setPeriods((current) => current.map((period, i) => i === index ? { ...period, [field]: value } : period));
  const addPeriod = () => setPeriods((current) => { const last = current[current.length - 1] || { endTime: "15:20" }; const [hour, minute] = last.endTime.split(":").map(Number); const next = hour * 60 + minute + 40; const start = `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`; const endMinutes = next + 40; const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`; return [...current, { period: current.length + 1, startTime: start, endTime: end }]; });
  const deletePeriod = (index) => { if (locked) return showError("Unlock the timetable before deleting periods."); if (periods.length <= 1) return showError("At least one school period is required."); setPeriods((current) => current.filter((_, i) => i !== index).map((period, i) => ({ ...period, period: i + 1 }))); };

  const generate = async () => {
    if (locked) return showError("This timetable is locked. Unlock it before regenerating.");
    if (plans.length !== activeClasses.length) return showError(`Complete every active class plan first (${plans.length}/${activeClasses.length} ready).`);
    if (rows.length && !window.confirm(`A ${academicYear} ${term} timetable already exists. Replace the existing timetable?`)) return;
    const invalid = periods.find((period) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.endTime) || period.startTime >= period.endTime);
    if (invalid) return showError("Every school period must have valid start and end times.");
    const slots = DAYS.flatMap((_, day) => periods.map((period) => ({ dayOfWeek: day + 1, period: period.period, startTime: period.startTime, endTime: period.endTime })));
    setSaving(true);
    try {
      const result = await apiRequest("/smis/timetable/generate", { method: "POST", body: JSON.stringify({ academicYear, term, classes: plans, slots, replaceExisting: Boolean(rows.length) }) });
      setRows(result?.data || []); await load(); showNotice(result?.message || `Generated ${result?.count || 0} lessons.`);
    } catch (e) { showError(e.message || "Unable to generate timetable."); } finally { setSaving(false); }
  };

  const lock = async () => { setSaving(true); try { await apiRequest("/smis/timetable/lock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); showNotice("Timetable locked. Editing and deletion are now disabled."); } catch (e) { showError(e.message || "Unable to lock timetable."); } finally { setSaving(false); } };
  const unlock = async () => { setSaving(true); try { await apiRequest("/smis/timetable/unlock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); showNotice("Timetable unlocked."); } catch (e) { showError(e.message || "Unable to unlock timetable."); } finally { setSaving(false); } };

  if (loading) return <main className="p-6"><div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading academic scheduling centre…</div></main>;

  return <main className="space-y-6 p-6">
    <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Angels Home SMIS</p><h1 className="text-2xl font-black text-blue-950">Academic Scheduling Centre</h1><p className="text-sm text-slate-500">Classes → Subjects → Teachers → class allocations → weekly lesson counts → school periods → whole-school generation.</p></div><Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold">Back to SMIS</Link></header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}

    <Panel title="Create subjects and allocate teachers"><div className="grid gap-6 lg:grid-cols-2"><form onSubmit={createSubject} className="grid gap-3"><input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name" className="rounded-xl border p-3"/><input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="Subject code" className="rounded-xl border p-3"/><textarea value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Description" className="rounded-xl border p-3"/><button disabled={saving} className="rounded-xl bg-blue-950 p-3 font-black text-white">Create subject</button></form><div><select value={allocationSubject} onChange={(e) => { const id = e.target.value; setAllocationSubject(id); const subject = subjectMap.get(id); setAllocationTeachers((subject?.teachers || []).map((teacher) => String(teacher?._id || teacher))); }} className="w-full rounded-xl border p-3"><option value="">Select subject to allocate teachers</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}</select><select multiple value={allocationTeachers} onChange={(e) => setAllocationTeachers([...e.target.selectedOptions].map((option) => option.value))} className="mt-3 min-h-36 w-full rounded-xl border p-3">{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{labelTeacher(teacher)}</option>)}</select><button type="button" disabled={saving || !allocationSubject} onClick={saveAllocation} className="mt-3 rounded-xl bg-amber-400 p-3 font-black text-blue-950">Save subject teacher allocation</button>{selectedSubject && <p className="mt-2 text-xs text-slate-500">Allocated teachers: {(selectedSubject.teachers || []).length}. Class plans will only allow these teachers.</p>}</div></div></Panel>

    <Panel title="School periods"><div className="space-y-2">{periods.map((period, index) => <div key={period.period} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[100px_1fr_1fr_auto]"><b>Period {period.period}</b><input type="time" disabled={locked} value={period.startTime} onChange={(e) => updatePeriod(index, "startTime", e.target.value)} className="rounded-lg border p-2 disabled:bg-slate-100"/><input type="time" disabled={locked} value={period.endTime} onChange={(e) => updatePeriod(index, "endTime", e.target.value)} className="rounded-lg border p-2 disabled:bg-slate-100"/><button type="button" disabled={locked} onClick={() => deletePeriod(index)} className="rounded-lg border px-3 py-2 font-bold text-red-600 disabled:opacity-40">Delete</button></div>)}<button type="button" disabled={locked} onClick={addPeriod} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-40">+ Add period</button></div></Panel>

    <Panel title="Build class-specific lesson plans"><div className="grid gap-3 md:grid-cols-2"><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value.trim())} className="rounded-xl border p-3"/><select value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-xl border p-3"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row"><select disabled={locked} value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setLessons([emptyLesson()]); }} className="flex-1 rounded-xl border bg-white p-3 disabled:bg-slate-100"><option value="">Select class</option>{activeClasses.map((item) => <option key={item._id} value={item._id}>{labelClass(item)}{plannedIds.has(String(item._id)) ? " · planned" : ""}</option>)}</select><button type="button" disabled={locked} onClick={saveClassPlan} className="rounded-xl bg-amber-400 px-4 font-black text-blue-950 disabled:opacity-40">Save class plan</button></div>{selectedClass && <div className="mt-4 space-y-3">{lessons.map((lesson, index) => { const subject = subjectMap.get(String(lesson.subject)); const allocatedTeachers = (subject?.teachers || []).map((teacher) => String(teacher?._id || teacher)); return <div key={`${index}-${lesson.subject}`} className="grid gap-2 rounded-xl border bg-white p-3 md:grid-cols-[1.3fr_1.3fr_140px_auto]"><select value={lesson.subject} onChange={(e) => updateLesson(index, "subject", e.target.value)} className="rounded-lg border p-2"><option value="">Select subject</option>{subjects.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.code})</option>)}</select><select value={lesson.teacher} onChange={(e) => updateLesson(index, "teacher", e.target.value)} disabled={!subject} className="rounded-lg border p-2 disabled:bg-slate-100"><option value="">Select allocated teacher</option>{teachers.filter((teacher) => allocatedTeachers.includes(String(teacher._id))).map((teacher) => <option key={teacher._id} value={teacher._id}>{labelTeacher(teacher)}</option>)}</select><input type="number" min="1" step="1" value={lesson.lessonsPerWeek} onChange={(e) => updateLesson(index, "lessonsPerWeek", e.target.value)} className="rounded-lg border p-2" placeholder="Lessons/week"/><button type="button" disabled={lessons.length === 1} onClick={() => removeLesson(index)} className="rounded-lg border px-3 py-2 font-bold text-red-600 disabled:opacity-30">Remove</button></div>; })}<button type="button" onClick={addLesson} className="rounded-xl border px-4 py-2 font-bold">+ Add subject</button></div>}</div></Panel>

    <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving || locked || plans.length !== activeClasses.length} onClick={generate} className="rounded-xl bg-blue-950 px-5 py-3 font-black text-white disabled:opacity-40">Generate whole-school timetable ({plans.length}/{activeClasses.length} classes ready)</button>{rows.length > 0 && !locked && <button type="button" disabled={saving} onClick={lock} className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white">Approve & lock timetable</button>}{locked && <button type="button" disabled={saving} onClick={unlock} className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-black text-amber-800">Unlock timetable</button>}</div>

    {plans.length > 0 && <Panel title="Configured classes"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <article key={String(plan.schoolClass)} className="rounded-xl border p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-black text-blue-950">{labelClass(classMap.get(String(plan.schoolClass)))}</h3><button type="button" disabled={locked} onClick={() => editPlan(plan.schoolClass)} className="text-xs font-bold text-blue-700 disabled:opacity-40">Edit</button></div><ul className="mt-3 space-y-1 text-sm text-slate-600">{plan.lessons.map((lesson) => { const subject = subjectMap.get(String(lesson.subject)); const teacher = teachers.find((item) => String(item._id) === String(lesson.teacher)); return <li key={`${lesson.subject}-${lesson.teacher}`}>{subject?.name || "Subject"} — {labelTeacher(teacher)} — {lesson.lessonsPerWeek}/week</li>; })}</ul></article>)}</div></Panel>}

    <Panel title="Whole-school timetable"><p className="mb-4 text-sm text-slate-500">The master timetable is generated for every active class. Teacher and class collisions are rejected by the scheduler and database constraints.</p>{rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Time</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id} className="border-b"><td className="p-3">{DAYS[Number(row.dayOfWeek) - 1] || row.dayOfWeek}</td><td className="p-3">{row.period}</td><td className="p-3">{row.startTime}–{row.endTime}</td><td className="p-3 font-bold">{labelClass(row.schoolClass)}</td><td className="p-3">{row.subject?.name || "—"}</td><td className="p-3">{labelTeacher(row.teacher)}</td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">No timetable has been generated for {academicYear}, {term}.</div>}</Panel>
  </main>;
}
