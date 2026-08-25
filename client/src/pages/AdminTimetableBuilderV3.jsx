import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  ["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"],
  ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"],
].map(([startTime, endTime], index) => ({ period: index + 1, startTime, endTime }));

const emptyLesson = () => ({ subject: "", teacher: "", lessonsPerWeek: 1 });
const classLabel = (item) => `${item?.name || "Unknown class"}${item?.stream ? ` · ${item.stream}` : ""}`;
const teacherLabel = (item) => `${item?.name || item?.email || "Unknown teacher"}${item?.teacherCode ? ` · ${item.teacherCode}` : ""}`;

function Panel({ title, subtitle, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-blue-950">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div><div className="p-5">{children}</div></section>;
}

export default function AdminTimetableBuilderV3() {
  const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([]); const [teachers, setTeachers] = useState([]); const [rows, setRows] = useState([]);
  const [classPlans, setClassPlans] = useState([]); const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString()); const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState(""); const [lessons, setLessons] = useState([emptyLesson()]);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });
  const [allocationSubject, setAllocationSubject] = useState(""); const [allocationTeachers, setAllocationTeachers] = useState([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState(false);

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
      const config = configResult?.config;
      setPeriods(config?.periods?.length ? config.periods : DEFAULT_PERIODS);
      setClassPlans(config?.classPlans || []); setLocked(Boolean(config?.locked));
    } catch (e) { setError(e.message || "Unable to load timetable configuration."); }
    finally { setLoading(false); }
  }, [academicYear, term]);

  useEffect(() => { void load(); }, [load]);

  const activeClasses = useMemo(() => classes.filter((item) => item.isActive !== false && (item.academicYear === academicYear || !item.academicYear)), [classes, academicYear]);
  const plannedIds = useMemo(() => new Set(classPlans.map((plan) => String(plan.schoolClass))), [classPlans]);
  const classMap = useMemo(() => new Map(classes.map((item) => [String(item._id), item])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((item) => [String(item._id), item])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((item) => [String(item._id), item])), [teachers]);
  const selectedSubject = subjectMap.get(String(allocationSubject));
  const selectedSubjectTeachers = useMemo(() => (selectedSubject?.teachers || []).map((teacher) => teacherMap.get(String(teacher._id || teacher))).filter(Boolean), [selectedSubject, teacherMap]);

  const message = (type, text) => { if (type === "error") { setError(text); setNotice(""); } else { setNotice(text); setError(""); } };
  const updateLesson = (index, field, value) => setLessons((items) => items.map((item, i) => i === index ? { ...item, [field]: value, ...(field === "subject" ? { teacher: "" } : {}) } : item));
  const removeLesson = (index) => setLessons((items) => { const next = items.filter((_, i) => i !== index); return next.length ? next : [emptyLesson()]; });

  const editClassPlan = (id) => {
    const plan = classPlans.find((item) => String(item.schoolClass) === String(id));
    if (!plan) return;
    setSelectedClass(String(id)); setLessons(plan.lessons.map((item) => ({ ...item })));
    message("notice", "Class plan loaded for editing. Save it again when finished.");
  };

  const saveClassPlan = () => {
    setError(""); setNotice("");
    if (locked) return message("error", "This timetable is locked. Unlock it before making changes.");
    if (!selectedClass) return message("error", "Select a class first.");
    if (!lessons.length) return message("error", "Add at least one subject to this class.");
    const clean = lessons.map((item) => ({ subject: String(item.subject || ""), teacher: String(item.teacher || "").trim(), lessonsPerWeek: Number(item.lessonsPerWeek) }));
    if (clean.some((item) => !item.subject || !item.teacher || !Number.isInteger(item.lessonsPerWeek) || item.lessonsPerWeek < 1)) return message("error", "Every class subject allocation needs a subject, an allocated teacher and lessons per week greater than zero.");
    for (const lesson of clean) {
      const subject = subjectMap.get(lesson.subject);
      if (!subject) return message("error", "One of the selected subjects no longer exists.");
      const allowed = (subject.teachers || []).some((teacher) => String(teacher._id || teacher) === lesson.teacher);
      if (!allowed) return message("error", `${subject.name} is not allocated to the selected teacher. Allocate the teacher to the subject first.`);
    }
    const count = clean.reduce((sum, item) => sum + item.lessonsPerWeek, 0);
    if (count > periods.length * DAYS.length) return message("error", `${classLabel(classMap.get(String(selectedClass)))} needs ${count} lessons but only ${periods.length * DAYS.length} weekly slots exist.`);
    setClassPlans((items) => [...items.filter((item) => String(item.schoolClass) !== String(selectedClass)), { schoolClass: selectedClass, lessons: clean }]);
    setSelectedClass(""); setLessons([emptyLesson()]); message("notice", "Class-specific subject and teacher allocations saved for generation.");
  };

  const createSubject = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const name = subjectForm.name.trim(); const code = subjectForm.code.trim().toUpperCase();
      if (!name || !code) throw new Error("Subject name and code are required.");
      await apiRequest("/smis/subjects", { method: "POST", body: JSON.stringify({ name, code, description: subjectForm.description.trim() }) });
      setSubjectForm({ name: "", code: "", description: "" }); await load(); message("notice", `${name} was created successfully.`);
    } catch (e) { message("error", e.message || "Unable to create subject."); }
    finally { setSaving(false); }
  };

  const saveAllocation = async () => {
    if (!allocationSubject) return message("error", "Select a subject first.");
    setSaving(true);
    try {
      await apiRequest(`/smis/subjects/${allocationSubject}/teachers`, { method: "PATCH", body: JSON.stringify({ teachers: allocationTeachers }) });
      await load(); message("notice", "Subject teacher allocation saved.");
    } catch (e) { message("error", e.message || "Unable to save subject teacher allocation."); }
    finally { setSaving(false); }
  };

  const updatePeriod = (index, field, value) => setPeriods((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const addPeriod = () => setPeriods((items) => { const last = items[items.length - 1]; const start = last?.endTime || "15:20"; const [h, m] = start.split(":").map(Number); const minutes = h * 60 + m + 40; return [...items, { period: items.length + 1, startTime: start, endTime: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}` }]; });
  const deletePeriod = (index) => { if (locked) return message("error", "Unlock the timetable before deleting periods."); if (periods.length <= 1) return message("error", "At least one period is required."); setPeriods((items) => items.filter((_, i) => i !== index).map((item, i) => ({ ...item, period: i + 1 }))); };

  const generate = async () => {
    if (locked) return message("error", "This timetable is locked. Unlock it before regenerating.");
    if (rows.length && !window.confirm(`A ${academicYear} ${term} timetable already exists. Replace the existing timetable?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (!activeClasses.length) throw new Error("Create at least one active class for this academic year.");
      const missing = activeClasses.filter((item) => !plannedIds.has(String(item._id)));
      if (missing.length) throw new Error(`Complete lesson plans for: ${missing.map(classLabel).join(", ")}`);
      const invalidPeriod = periods.find((period) => !period.startTime || !period.endTime || period.startTime >= period.endTime);
      if (invalidPeriod) throw new Error("Every period must have a valid start and end time.");
      const slots = DAYS.flatMap((_, dayIndex) => periods.map((period) => ({ dayOfWeek: dayIndex + 1, period: period.period, startTime: period.startTime, endTime: period.endTime })));
      const result = await apiRequest("/smis/timetable/generate", { method: "POST", body: JSON.stringify({ academicYear, term, classes: classPlans, slots, replaceExisting: Boolean(rows.length) }) });
      setRows(result?.data || []); await load(); message("notice", result?.message || `Generated ${result?.count || 0} lessons.`);
    } catch (e) { message("error", e.message || "Unable to generate timetable."); }
    finally { setSaving(false); }
  };

  const lockTimetable = async () => {
    setSaving(true);
    try { await apiRequest("/smis/timetable/lock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); message("notice", "Timetable locked. Admin unlock is required before changes."); }
    catch (e) { message("error", e.message || "Unable to lock timetable."); } finally { setSaving(false); }
  };
  const unlockTimetable = async () => {
    setSaving(true);
    try { await apiRequest("/smis/timetable/unlock", { method: "POST", body: JSON.stringify({ academicYear, term }) }); await load(); message("notice", "Timetable unlocked."); }
    catch (e) { message("error", e.message || "Unable to unlock timetable."); } finally { setSaving(false); }
  };

  if (loading) return <main className="p-6"><div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading academic scheduling centre…</div></main>;

  return <main className="space-y-6 p-6">
    <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Angels Home SMIS</p><h1 className="text-2xl font-black text-blue-950">Academic Scheduling Centre</h1><p className="text-sm text-slate-500">Classes → Subjects → Teachers → Class allocations → Weekly lesson counts → Periods → Generate.</p></div><Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold">Back to SMIS</Link></header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Create subjects" subtitle="Subjects are created once, then teachers are allocated before class plans are built."><form onSubmit={createSubject} className="grid gap-3 md:grid-cols-2"><input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name" className="rounded-xl border p-3"/><input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="Code" className="rounded-xl border p-3 uppercase"/><input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Description" className="rounded-xl border p-3 md:col-span-2"/><button disabled={saving} className="rounded-xl bg-blue-950 p-3 font-black text-white md:col-span-2">Create subject</button></form><div className="mt-5 rounded-xl border p-4"><h3 className="font-black text-blue-950">Allocate teachers to subject</h3><div className="mt-3 grid gap-3"><select value={allocationSubject} onChange={(e) => { const value = e.target.value; setAllocationSubject(value); const subject = subjectMap.get(value); setAllocationTeachers((subject?.teachers || []).map((teacher) => String(teacher._id || teacher))); }} className="rounded-xl border p-3"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}</select><select multiple value={allocationTeachers} onChange={(e) => setAllocationTeachers([...e.target.selectedOptions].map((option) => option.value))} className="min-h-36 rounded-xl border p-3">{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacherLabel(teacher)}</option>)}</select><button type="button" disabled={saving} onClick={saveAllocation} className="rounded-xl bg-amber-400 p-3 font-black text-blue-950">Save subject teacher allocation</button></div></div></Panel>
      <Panel title="School periods" subtitle="Periods repeat Monday–Friday. Deleted periods are renumbered automatically."><div className="space-y-2">{periods.map((period, index) => <div key={period.period} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-center"><b>Period {period.period}</b><input type="time" value={period.startTime} onChange={(e) => updatePeriod(index, "startTime", e.target.value)} className="rounded-lg border p-2"/><input type="time" value={period.endTime} onChange={(e) => updatePeriod(index, "endTime", e.target.value)} className="rounded-lg border p-2"/><button type="button" onClick={() => deletePeriod(index)} className="rounded-lg border px-3 py-2 font-bold text-red-600">Delete</button></div>)}<button type="button" onClick={addPeriod} className="rounded-xl border px-4 py-2 font-bold">+ Add period</button></div></Panel>
    </div>
    <Panel title="Class-specific lesson plans" subtitle="Each class gets its own subject/teacher allocation. Teachers are selected only from the teachers allocated to that subject."><div className="grid gap-3 md:grid-cols-2"><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value.trim())} className="rounded-xl border p-3" placeholder="Academic year"/><select value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-xl border p-3"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex flex-col gap-3 md:flex-row"><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full rounded-xl border bg-white p-3"><option value="">Select class</option>{activeClasses.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}{plannedIds.has(String(item._id)) ? " · planned" : ""}</option>)}</select><button type="button" onClick={saveClassPlan} disabled={locked} className="rounded-xl bg-amber-400 px-4 py-3 font-black text-blue-950">Save class plan</button></div>{lessons.map((lesson, index) => { const subject = subjectMap.get(String(lesson.subject)); const allocated = (subject?.teachers || []).map((teacher) => teacherMap.get(String(teacher._id || teacher))).filter(Boolean); return <div key={index} className="mt-3 grid gap-2 md:grid-cols-[1.1fr_1fr_150px_auto]"><select value={lesson.subject} onChange={(e) => updateLesson(index, "subject", e.target.value)} className="rounded-lg border p-2"><option value="">Subject</option>{subjects.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.code})</option>)}</select><select value={lesson.teacher} onChange={(e) => updateLesson(index, "teacher", e.target.value)} disabled={!subject || !allocated.length} className="rounded-lg border p-2"><option value="">{subject ? (allocated.length ? "Select allocated teacher" : "No teacher allocated") : "Select subject first"}</option>{allocated.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacherLabel(teacher)}</option>)}</select><input min="1" max={periods.length * DAYS.length} type="number" value={lesson.lessonsPerWeek} onChange={(e) => updateLesson(index, "lessonsPerWeek", e.target.value)} className="rounded-lg border p-2"/><button type="button" onClick={() => removeLesson(index)} className="rounded-lg border px-3 font-bold text-red-600">Remove</button></div>; })}<button type="button" onClick={() => setLessons((items) => [...items, emptyLesson()])} className="mt-3 rounded-xl border px-4 py-2 font-bold">+ Add subject</button>{classPlans.length > 0 && <div className="mt-5 space-y-2">{classPlans.map((plan) => <div key={String(plan.schoolClass)} className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-3 md:flex-row md:items-center"><div><b>{classLabel(classMap.get(String(plan.schoolClass)))}</b><p className="text-xs text-slate-500">{plan.lessons.map((lesson) => `${subjectMap.get(String(lesson.subject))?.name || "Subject"} · ${teacherMap.get(String(lesson.teacher))?.name || "Teacher"} · ${lesson.lessonsPerWeek}/week`).join(" | ")}</p></div><button type="button" onClick={() => editClassPlan(plan.schoolClass)} disabled={locked} className="rounded-lg border px-3 py-2 text-sm font-bold">Edit</button></div>)}</div>}</div></Panel>
    <div className="flex flex-wrap gap-3"><button onClick={generate} disabled={saving || locked} className="rounded-xl bg-blue-950 px-5 py-3 font-black text-white">{saving ? "Working…" : `Generate whole-school timetable (${classPlans.length}/${activeClasses.length} classes ready)`}</button>{locked ? <button onClick={unlockTimetable} disabled={saving} className="rounded-xl border border-red-300 px-5 py-3 font-black text-red-700">Unlock timetable</button> : <button onClick={lockTimetable} disabled={saving || !rows.length} className="rounded-xl border px-5 py-3 font-black">Lock generated timetable</button>}</div>
    </Panel>
    <Panel title="Whole-school timetable" subtitle="The master timetable is generated across all classes with class and teacher collision protection.">{rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id} className="border-b"><td className="p-3">{DAYS[(Number(row.dayOfWeek) || 1) - 1]}</td><td className="p-3">{row.period} · {row.startTime}-{row.endTime}</td><td className="p-3">{classLabel(row.schoolClass)}</td><td className="p-3">{row.subject?.name || "—"}</td><td className="p-3">{row.teacher?.name || row.teacher?.email || "—"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No timetable has been generated for {academicYear}, {term}.</p>}</Panel>
  </main>;
}
