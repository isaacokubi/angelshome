import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, smisApi } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  ["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"],
  ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"],
];

const label = (item) => `${item.name}${item.stream ? ` · ${item.stream}` : ""}`;
const teacherLabel = (teacher) => `${teacher.name}${teacher.teacherCode ? ` · ${teacher.teacherCode}` : ""}`;

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-blue-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AdminTimetableBuilderV2() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState("Term 1");
  const [selectedClass, setSelectedClass] = useState("");
  const [lessons, setLessons] = useState([{ subject: "", teacher: "", lessonsPerWeek: 4 }]);
  const [classPlans, setClassPlans] = useState([]);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS.map(([startTime, endTime], index) => ({ period: index + 1, startTime, endTime })));
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [timetable, classResult, subjectResult, teacherResult] = await Promise.all([
        smisApi.timetable({ academicYear, term }),
        apiRequest("/smis/classes"),
        apiRequest("/smis/subjects"),
        apiRequest("/smis/teachers"),
      ]);
      setRows(Array.isArray(timetable?.data) ? timetable.data : []);
      setClasses(classResult?.classes || []);
      setSubjects(subjectResult?.subjects || []);
      setTeachers(teacherResult?.teachers || []);
    } catch (e) {
      setError(e.message || "Unable to load scheduling data.");
    } finally {
      setLoading(false);
    }
  }, [academicYear, term]);

  useEffect(() => { void load(); }, [load]);

  const activeClasses = useMemo(
    () => classes.filter((item) => item.academicYear === academicYear || !item.academicYear),
    [classes, academicYear],
  );
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject._id, subject])), [subjects]);
  const plannedClassIds = useMemo(() => new Set(classPlans.map((plan) => plan.schoolClass)), [classPlans]);

  const clearMessages = () => { setError(""); setNotice(""); };

  const createSubject = async (event) => {
    event.preventDefault();
    clearMessages();
    const name = subjectForm.name.trim();
    const code = subjectForm.code.trim().toUpperCase();
    if (!name || !code) return setError("Subject name and subject code are required.");
    setSaving(true);
    try {
      await apiRequest("/smis/subjects", {
        method: "POST",
        body: JSON.stringify({ name, code, description: subjectForm.description.trim() }),
      });
      setSubjectForm({ name: "", code: "", description: "" });
      setNotice(`${name} was created and is now available for timetable generation.`);
      await load();
    } catch (e) {
      setError(e.message || "Unable to create subject. The code may already exist.");
    } finally {
      setSaving(false);
    }
  };

  const updateLesson = (index, field, value) => {
    setLessons((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const addLessonRow = () => setLessons((items) => [...items, { subject: "", teacher: "", lessonsPerWeek: 4 }]);

  const removeLessonRow = (index) => {
    setLessons((items) => {
      const next = items.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [{ subject: "", teacher: "", lessonsPerWeek: 4 }];
    });
  };

  const addClassPlan = () => {
    clearMessages();
    if (!selectedClass) return setError("Select a class first.");
    const validLessons = lessons
      .filter((item) => item.subject && item.teacher.trim() && Number(item.lessonsPerWeek) > 0)
      .map((item) => ({ ...item, teacher: item.teacher.trim(), lessonsPerWeek: Number(item.lessonsPerWeek) }));
    if (!validLessons.length) return setError("Add at least one subject, teacher and lessons-per-week value.");
    setClassPlans((plans) => [
      ...plans.filter((plan) => plan.schoolClass !== selectedClass),
      { schoolClass: selectedClass, lessons: validLessons },
    ]);
    setSelectedClass("");
    setLessons([{ subject: "", teacher: "", lessonsPerWeek: 4 }]);
    setNotice("Class lesson plan saved. Add the remaining classes before generating the whole-school timetable.");
  };

  const deleteClassPlan = (schoolClass) => setClassPlans((plans) => plans.filter((plan) => plan.schoolClass !== schoolClass));

  const updatePeriod = (index, field, value) => {
    setPeriods((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const addPeriod = () => {
    setPeriods((items) => {
      const last = items[items.length - 1];
      const start = last?.endTime || "15:20";
      const [hour, minute] = start.split(":").map(Number);
      const endMinutes = hour * 60 + minute + 40;
      const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      return [...items, { period: items.length + 1, startTime: start, endTime: end }];
    });
  };

  const deletePeriod = (index) => {
    if (periods.length <= 1) return setError("At least one school period is required.");
    clearMessages();
    setPeriods((items) => items.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, period: itemIndex + 1 })));
    setNotice("Period deleted and the remaining periods were renumbered.");
  };

  const generateWholeSchool = async (event) => {
    event.preventDefault();
    clearMessages();
    if (!activeClasses.length) return setError("Create at least one active class for this academic year.");
    if (classPlans.length !== activeClasses.length) {
      const missing = activeClasses.filter((item) => !plannedClassIds.has(item._id)).map(label);
      return setError(`Every class needs a weekly lesson plan before generation. Missing: ${missing.join(", ")}`);
    }
    if (periods.some((period) => !period.startTime || !period.endTime || period.startTime >= period.endTime)) {
      return setError("Every period must have a valid start time before generation.");
    }
    setSaving(true);
    try {
      const slots = DAYS.flatMap((_, dayIndex) => periods.map((period) => ({
        dayOfWeek: dayIndex + 1,
        period: period.period,
        startTime: period.startTime,
        endTime: period.endTime,
      })));
      const result = await apiRequest("/smis/timetable/generate", {
        method: "POST",
        body: JSON.stringify({ academicYear, term, classes: classPlans, slots }),
      });
      setRows(result?.data || []);
      setNotice(result?.message || `Whole-school timetable generated with ${result?.count || 0} lessons.`);
    } catch (e) {
      setError(e.message || "Unable to generate the whole-school timetable.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-6"><div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading academic scheduling centre…</div></main>;

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Angels Home SMIS</p>
          <h1 className="text-2xl font-black text-blue-950">Academic Scheduling Centre</h1>
          <p className="text-sm text-slate-500">Create subjects, configure periods and generate one collision-free timetable for the entire school.</p>
        </div>
        <Link to="/admin/smis" className="rounded-xl border px-4 py-2 text-sm font-bold text-blue-950">Back to SMIS</Link>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Create subjects" subtitle="Subjects created here immediately become available when building class lesson plans.">
          <form onSubmit={createSubject} className="grid gap-3 md:grid-cols-2">
            <input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Subject name e.g. Mathematics" className="rounded-xl border p-3" />
            <input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="Code e.g. MATH" className="rounded-xl border p-3 uppercase" />
            <input value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="Description (optional)" className="rounded-xl border p-3 md:col-span-2" />
            <button disabled={saving} className="rounded-xl bg-blue-950 px-4 py-3 font-black text-white md:col-span-2">{saving ? "Saving…" : "Create subject"}</button>
          </form>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {subjects.map((subject) => <div key={subject._id} className="rounded-xl border bg-slate-50 p-3"><p className="font-black text-blue-950">{subject.name}</p><p className="text-xs font-bold text-slate-500">{subject.code} · {(subject.teachers || []).length} teacher(s) allocated</p></div>)}
          </div>
        </Panel>

        <Panel title="School periods" subtitle="Periods repeat Monday–Friday. Delete periods you do not need; the remaining periods are automatically renumbered.">
          <div className="space-y-3">
            {periods.map((period, index) => (
              <div key={period.period} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[80px_1fr_1fr_auto] sm:items-center">
                <span className="font-black text-blue-950">Period {period.period}</span>
                <input type="time" value={period.startTime} onChange={(e) => updatePeriod(index, "startTime", e.target.value)} className="rounded-lg border p-2" />
                <input type="time" value={period.endTime} onChange={(e) => updatePeriod(index, "endTime", e.target.value)} className="rounded-lg border p-2" />
                <button type="button" onClick={() => deletePeriod(index)} className="rounded-lg border px-3 py-2 text-sm font-bold text-red-600">Delete</button>
              </div>
            ))}
            <button type="button" onClick={addPeriod} className="rounded-lg border px-3 py-2 text-sm font-bold">+ Add period</button>
          </div>
        </Panel>
      </div>

      <Panel title="Build the whole-school lesson plan" subtitle="Configure every active class for the selected academic year. The final generator uses all class plans together, so a teacher can never be scheduled in two classes at the same time.">
        <div className="grid gap-3 md:grid-cols-2">
          <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="Academic year" className="rounded-xl border p-3" />
          <select value={term} onChange={(e) => setTerm(e.target.value)} className="rounded-xl border p-3"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full rounded-xl border bg-white p-3">
              <option value="">Select class</option>
              {activeClasses.map((item) => <option key={item._id} value={item._id}>{label(item)}{plannedClassIds.has(item._id) ? " · planned" : ""}</option>)}
            </select>
            <button type="button" onClick={addClassPlan} className="whitespace-nowrap rounded-xl bg-amber-400 px-4 py-3 font-black text-blue-950">Save class plan</button>
          </div>

          {lessons.map((lesson, index) => (
            <div key={index} className="mt-3 grid gap-2 md:grid-cols-[1.1fr_1fr_150px_auto]">
              <select value={lesson.subject} onChange={(e) => updateLesson(index, "subject", e.target.value)} className="rounded-lg border p-2">
                <option value="">Subject</option>
                {subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}
              </select>
              <input value={lesson.teacher} onChange={(e) => updateLesson(index, "teacher", e.target.value)} placeholder="Teacher code or exact name" list="teacher-list" className="rounded-lg border p-2" />
              <input min="1" type="number" value={lesson.lessonsPerWeek} onChange={(e) => updateLesson(index, "lessonsPerWeek", e.target.value)} className="rounded-lg border p-2" />
              <button type="button" onClick={() => removeLessonRow(index)} className="rounded-lg border px-3 font-bold text-red-600">Remove</button>
            </div>
          ))}
          <datalist id="teacher-list">{teachers.map((teacher) => <option key={teacher._id} value={teacher.teacherCode || teacher.name}>{teacherLabel(teacher)}</option>)}</datalist>
          <button type="button" onClick={addLessonRow} className="mt-3 rounded-lg border px-3 py-2 font-bold">+ Add subject</button>
        </div>

        <div className="mt-5 space-y-2">
          {activeClasses.map((schoolClass) => {
            const plan = classPlans.find((item) => item.schoolClass === schoolClass._id);
            return (
              <div key={schoolClass._id} className={`flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center ${plan ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}`}>
                <div>
                  <p className="font-black text-blue-950">{label(schoolClass)}</p>
                  <p className="text-xs text-slate-600">{plan ? plan.lessons.map((item) => `${subjectMap.get(item.subject)?.name || "Subject"}: ${item.lessonsPerWeek}/week · ${item.teacher}`).join(" · ") : "No weekly lesson plan yet."}</p>
                </div>
                {plan && <button type="button" onClick={() => deleteClassPlan(schoolClass._id)} className="text-sm font-bold text-red-600">Remove plan</button>}
              </div>
            );
          })}
        </div>

        <button type="button" disabled={saving || !activeClasses.length} onClick={generateWholeSchool} className="mt-5 w-full rounded-xl bg-blue-950 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Generating whole-school timetable…" : `Generate whole-school timetable (${classPlans.length}/${activeClasses.length} classes ready)`}
        </button>
      </Panel>

      <Panel title="Whole-school timetable" subtitle="This is the timetable generated from all class plans. Teacher collisions are rejected by the scheduler before records are saved.">
        {!rows.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No timetable has been generated for {academicYear}, {term}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Time</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th></tr></thead>
              <tbody>
                {rows.map((row) => <tr key={row._id} className="border-t"><td className="p-3">{DAYS[(row.dayOfWeek || 1) - 1] || row.dayOfWeek}</td><td className="p-3 font-bold">{row.period}</td><td className="p-3">{row.startTime}–{row.endTime}</td><td className="p-3 font-bold">{row.schoolClass?.name}{row.schoolClass?.stream ? ` · ${row.schoolClass.stream}` : ""}</td><td className="p-3">{row.subject?.name || "—"}</td><td className="p-3">{row.teacher?.name || `${row.teacher?.firstName || ""} ${row.teacher?.lastName || ""}`.trim() || "—"}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </main>
  );
}
