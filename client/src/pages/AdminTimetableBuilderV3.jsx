import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  ["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"],
  ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"],
].map(([startTime, endTime], index) => ({ period: index + 1, startTime, endTime }));

const emptyLesson = () => ({ subject: "", teacher: "", lessonsPerWeek: 4 });
const classLabel = (item) => `${item?.name || "Unknown class"}${item?.stream ? ` · ${item.stream}` : ""}`;
const teacherLabel = (item) => `${item?.name || item?.email || "Unknown teacher"}${item?.teacherCode ? ` · ${item.teacherCode}` : ""}`;
const totalLessons = (plan) => plan.lessons.reduce((sum, lesson) => sum + Number(lesson.lessonsPerWeek || 0), 0);

function Panel({ title, subtitle, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-blue-950">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div><div className="p-5">{children}</div></section>;
}

export default function AdminTimetableBuilderV3() {
  const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([]); const [teachers, setTeachers] = useState([]); const [rows, setRows] = useState([]);
  const [classPlans, setClassPlans] = useState([]); const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString()); const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState(""); const [lessons, setLessons] = useState([emptyLesson()]);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");

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
      if (config) {
        setPeriods(config.periods?.length ? config.periods : DEFAULT_PERIODS);
        setClassPlans(config.classPlans || []);
      } else {
        setPeriods(DEFAULT_PERIODS); setClassPlans([]);
      }
    } catch (e) { setError(e.message || "Unable to load timetable configuration."); }
    finally { setLoading(false); }
  }, [academicYear, term]);

  useEffect(() => { void load(); }, [load]);

  const activeClasses = useMemo(() => classes.filter((item) => item.isActive !== false && (item.academicYear === academicYear || !item.academicYear)), [classes, academicYear]);
  const plannedIds = useMemo(() => new Set(classPlans.map((plan) => String(plan.schoolClass))), [classPlans]);
  const classMap = useMemo(() => new Map(classes.map((item) => [String(item._id), item])), [classes]);
  const teacherMap = useMemo(() => new Map(teachers.map((item) => [String(item._id), item])), [teachers]);

  const message = (type, text) => { if (type === "error") { setError(text); setNotice(""); } else { setNotice(text); setError(""); } };
  const updateLesson = (index, field, value) => setLessons((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeLesson = (index) => setLessons((items) => { const next = items.filter((_, i) => i !== index); return next.length ? next : [emptyLesson()]; });

  const editClassPlan = (id) => {
    const plan = classPlans.find((item) => String(item.schoolClass) === String(id));
    if (!plan) return;
    setSelectedClass(String(id)); setLessons(plan.lessons.map((item) => ({ ...item })));
    setClassPlans((items) => items.filter((item) => String(item.schoolClass) !== String(id)));
    message("notice", "Class plan loaded for editing. Save it again when finished.");
  };

  const saveClassPlan = () => {
    setError(""); setNotice("");
    if (!selectedClass) return message("error", "Select a class first.");
    const clean = lessons.filter((item) => item.subject && String(item.teacher || "").trim() && Number.isInteger(Number(item.lessonsPerWeek)) && Number(item.lessonsPerWeek) > 0).map((item) => ({ subject: item.subject, teacher: String(item.teacher).trim(), lessonsPerWeek: Number(item.lessonsPerWeek) }));
    if (!clean.length) return message("error", "Add at least one subject, teacher and positive lessons-per-week value.");
    const count = clean.reduce((sum, item) => sum + item.lessonsPerWeek, 0);
    if (count > periods.length * DAYS.length) return message("error", `${classLabel(classMap.get(String(selectedClass)))} needs ${count} lessons but only ${periods.length * DAYS.length} weekly slots exist.`);
    setClassPlans((items) => [...items.filter((item) => String(item.schoolClass) !== String(selectedClass)), { schoolClass: selectedClass, lessons: clean }]);
    setSelectedClass(""); setLessons([emptyLesson()]); message("notice", "Class lesson plan saved locally and will be persisted when the timetable is generated.");
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

  const updatePeriod = (index, field, value) => setPeriods((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const addPeriod = () => setPeriods((items) => {
    const last = items[items.length - 1]; const start = last?.endTime || "15:20"; const [h, m] = start.split(":").map(Number); const minutes = h * 60 + m + 40;
    return [...items, { period: items.length + 1, startTime: start, endTime: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}` }];
  });
  const deletePeriod = (index) => { if (periods.length <= 1) return message("error", "At least one period is required."); setPeriods((items) => items.filter((_, i) => i !== index).map((item, i) => ({ ...item, period: i + 1 }))); message("notice", "Period deleted and remaining periods renumbered."); };

  const generate = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      if (!activeClasses.length) throw new Error("Create at least one active class for this academic year.");
      const missing = activeClasses.filter((item) => !plannedIds.has(String(item._id)));
      if (missing.length) throw new Error(`Complete lesson plans for: ${missing.map(classLabel).join(", ")}`);
      const invalidPeriod = periods.find((period) => !period.startTime || !period.endTime || period.startTime >= period.endTime);
      if (invalidPeriod) throw new Error("Every period must have a valid start and end time.");
      const slots = DAYS.flatMap((_, dayIndex) => periods.map((period) => ({ dayOfWeek: dayIndex + 1, period: period.period, startTime: period.startTime, endTime: period.endTime })));
      const result = await apiRequest("/smis/timetable/generate", { method: "POST", body: JSON.stringify({ academicYear, term, classes: classPlans, slots }) });
      setRows(result?.data || []); await load(); message("notice", result?.message || `Generated ${result?.count || 0} lessons.`);
    } catch (e) { message("error", e.message || "Unable to generate timetable."); }
    finally { setSaving(false); }
  };

  const groupedRows = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => { const key = String(row.schoolClass?._id || row.schoolClass); if (!map.has(key)) map.set(key, []); map.get(key).push(row); });
    return [...map.entries()].sort((a, b) => classLabel(classMap.get(a[0]) || a[1][0]?.schoolClass).localeCompare(classLabel(classMap.get(b[0]) || b[1][0]?.schoolClass)));
  }, [rows, classMap]);

  if (loading) return <main className="p-6"><div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading academic scheduling centre…</div></main>;

  return <main className="space-y-6 p-6">
    <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Angels Home SMIS</p><h1 className="text-2xl font-black text-blue-950">Academic Scheduling Centre</h1><p className="text-sm text-slate-500">Build, validate and persist one collision-free timetable for the entire school.</p></div><Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold">Back to SMIS</Link></header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Create subjects" subtitle="A subject must exist before it can be placed in a class lesson plan."><form onSubmit={createSubject} className="grid gap-3 md:grid-cols-2"><input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name" className="rounded-xl border p-3"/><input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="Code" className="rounded-xl border p-3 uppercase"/><input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Description" className="rounded-xl border p-3 md:col-span-2"/><button disabled={saving} className="rounded-xl bg-blue-950 p-3 font-black text-white md:col-span-2">Create subject</button></form><div className="mt-4 grid gap-2 sm:grid-cols-2">{subjects.map((subject) => <div key={subject._id} className="rounded-xl border bg-slate-50 p-3"><p className="font-black">{subject.name}</p><p className="text-xs text-slate-500">{subject.code} · {(subject.teachers || []).length} allocated teacher(s)</p></div>)}</div></Panel>
      <Panel title="School periods" subtitle="Periods are shared by every class Monday–Friday. These settings are saved with the generated timetable."><div className="space-y-2">{periods.map((period, index) => <div key={period.period} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-center"><b>Period {period.period}</b><input type="time" value={period.startTime} onChange={(e) => updatePeriod(index, "startTime", e.target.value)} className="rounded-lg border p-2"/><input type="time" value={period.endTime} onChange={(e) => updatePeriod(index, "endTime", e.target.value)} className="rounded-lg border p-2"/><button type="button" onClick={() => deletePeriod(index)} className="rounded-lg border px-3 py-2 font-bold text-red-600">Delete</button></div>)}<button type="button" onClick={addPeriod} className="rounded-xl border px-4 py-2 font-bold">+ Add period</button></div></Panel>
    </div>
    <Panel title="Whole-school lesson plan" subtitle="Every active class must be planned before generation. The server validates teacher allocation, weekly capacity and collisions."><div className="grid gap-3 md:grid-cols-2"><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value.trim())} className="rounded-xl border p-3" placeholder="Academic year"/><select value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-xl border p-3"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex flex-col gap-3 md:flex-row"><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full rounded-xl border bg-white p-3"><option value="">Select class</option>{activeClasses.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}{plannedIds.has(String(item._id)) ? " · planned" : ""}</option>)}</select><button type="button" onClick={saveClassPlan} className="rounded-xl bg-amber-400 px-4 py-3 font-black text-blue-950">Save class plan</button></div>{lessons.map((lesson, index) => <div key={index} className="mt-3 grid gap-2 md:grid-cols-[1.1fr_1fr_150px_auto]"><select value={lesson.subject} onChange={(e) => updateLesson(index, "subject", e.target.value)} className="rounded-lg border p-2"><option value="">Subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}</select><input value={lesson.teacher} onChange={(e) => updateLesson(index, "teacher", e.target.value)} list="teacher-list" placeholder="Teacher code or exact name" className="rounded-lg border p-2"/><input min="1" max={periods.length * DAYS.length} type="number" value={lesson.lessonsPerWeek} onChange={(e) => updateLesson(index, "lessonsPerWeek", e.target.value)} className="rounded-lg border p-2"/><button type="button" onClick={() => removeLesson(index)} className="rounded-lg border px-3 font-bold text-red-600">Remove</button></div>)}<datalist id="teacher-list">{teachers.map((teacher) => <option key={teacher._id} value={teacher.teacherCode || teacher.name}>{teacherLabel(teacher)}</option>)}</datalist><button type="button" onClick={() => setLessons((items) => [...items, emptyLesson()])} className="mt-3 rounded-lg border px-3 py-2 font-bold">+ Add subject</button></div><div className="mt-5 space-y-2">{classPlans.map((plan) => <div key={plan.schoolClass} className="flex flex-col justify-between gap-3 rounded-xl border p-3 md:flex-row md:items-center"><div><p className="font-black text-blue-950">{classLabel(classMap.get(String(plan.schoolClass)))}</p><p className="text-xs text-slate-500">{plan.lessons.length} subjects · {totalLessons(plan)} lessons/week</p></div><div className="flex gap-2"><button type="button" onClick={() => editClassPlan(plan.schoolClass)} className="rounded-lg border px-3 py-2 text-sm font-bold">Edit</button><button type="button" onClick={() => setClassPlans((items) => items.filter((item) => String(item.schoolClass) !== String(plan.schoolClass)))} className="rounded-lg border px-3 py-2 text-sm font-bold text-red-600">Remove</button></div></div>)}</div><div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-black text-blue-950">{classPlans.length}/{activeClasses.length} classes ready</p><p className="text-sm text-blue-800">Generation creates the complete school timetable in one server-side operation.</p></div><button type="button" disabled={saving || classPlans.length !== activeClasses.length} onClick={generate} className="rounded-xl bg-blue-950 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Generating…" : "Generate whole-school timetable"}</button></div></Panel>
    <Panel title="Whole-school timetable" subtitle={`Saved timetable for ${academicYear}, ${term}. Administrators can see every class; portal users receive only their permitted class scope.`}>{!rows.length ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No timetable has been generated for this academic year and term.</div> : <div className="space-y-6">{DAYS.map((day, dayIndex) => { const dayRows = rows.filter((row) => Number(row.dayOfWeek) === dayIndex + 1).sort((a, b) => Number(a.period) - Number(b.period) || String(a.schoolClass?.name || "").localeCompare(String(b.schoolClass?.name || ""))); return <div key={day}><h3 className="mb-2 text-lg font-black text-blue-950">{day}</h3><div className="overflow-x-auto rounded-xl border"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Period</th><th className="p-3">Time</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th></tr></thead><tbody>{dayRows.length ? dayRows.map((row) => <tr key={row._id} className="border-t"><td className="p-3 font-bold">{row.period}</td><td className="p-3">{row.startTime}–{row.endTime}</td><td className="p-3 font-bold">{classLabel(row.schoolClass)}</td><td className="p-3">{row.subject?.name || "—"}</td><td className="p-3">{teacherMap.get(String(row.teacher?._id))?.name || row.teacher?.name || row.teacher?.email || "—"}</td></tr>) : <tr><td colSpan="5" className="p-4 text-center text-slate-400">No lessons scheduled.</td></tr>}</tbody></table></div></div>; })}</div>}</Panel>
  </main>;
}
