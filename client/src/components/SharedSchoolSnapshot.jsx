import { Link } from "react-router-dom";

const roleActions = {
  admin: [["Manage pupils", "/portal/admin/pupils"], ["Manage teachers", "/portal/admin/teachers"], ["Manage parents", "/portal/admin/parents"], ["Manage sponsors", "/portal/admin/sponsors"], ["Library", "/portal/admin/library"], ["Results", "/portal/results"], ["Timetable", "/admin/smis/timetable"]],
  teacher: [["My classes", "/portal/teacher/classes"], ["Digital classroom", "/portal/teacher/online-classroom"], ["Library", "/portal/teacher/library"], ["Results", "/portal/results"], ["My timetable", "/portal/timetable"], ["Attendance", "/portal/teacher/attendance"], ["School notifications", "/portal/notifications"]],
  pupil: [["My learning", "/portal/pupil/learning"], ["Digital classroom", "/portal/pupil/online-classroom"], ["Library", "/portal/pupil/library"], ["Results", "/portal/results"], ["My timetable", "/portal/timetable"], ["Attendance", "/portal/pupil/attendance"], ["School notifications", "/portal/notifications"]],
  parent: [["Results", "/portal/results"], ["School updates", "/portal/notifications"], ["My children", "/portal/parent#children"], ["Library", "/portal/parent/library"], ["Attendance", "/portal/parent/attendance"], ["School timetable", "/portal/timetable"]],
  sponsor: [["Results", "/portal/results"], ["My impact", "/portal/sponsor/impact"], ["Library", "/portal/sponsor/library"], ["Attendance", "/portal/sponsor/attendance"], ["School timetable", "/portal/timetable"], ["School notifications", "/portal/notifications"]],
};

function metricValue(value, fallback = "0") { return value === null || value === undefined ? fallback : value; }

export default function SharedSchoolSnapshot({ data, role, metrics }) {
  const stats = Array.isArray(data?.stats) ? data.stats : [];
  const actions = roleActions[role] || roleActions.pupil;
  const school = metrics?.school || data?.school || {};
  const pupilLive = role === "pupil" ? data?.pupilLive : null;

  const displayStats = role === "admin"
    ? [
        { label: "Pupils", value: metricValue(school.pupils), note: "Active school pupils" },
        { label: "Teachers", value: metricValue(school.teachers), note: "Active teaching staff" },
        { label: "Classes", value: metricValue(school.classes), note: "Active classes" },
        { label: "Subjects", value: metricValue(school.subjects), note: "Active subjects" },
        { label: "Results", value: metricValue(school.results), note: `${metricValue(school.resultsToday)} entered today` },
        { label: "Open exams", value: metricValue(school.openExams), note: `${metricValue(school.exams)} total examinations` },
        { label: "Attendance", value: metricValue(school.attendanceToday?.totalMarked), note: school.attendanceToday?.attendanceRate == null ? "No records marked today" : `${school.attendanceToday.attendanceRate}% present/late` },
        { label: "Library", value: metricValue(school.library?.titles), note: `${metricValue(school.library?.available)} copies available` },
      ]
    : role === "teacher"
      ? [
          { label: "My classes", value: metricValue(metrics?.teacher?.classes, "Not assigned"), note: "Classes assigned to you" },
          { label: "My subjects", value: metricValue(metrics?.teacher?.subjects, "Not assigned"), note: "Subjects assigned to you" },
          { label: "Published content", value: metricValue(metrics?.teacher?.publishedContent), note: "Live learning resources" },
          { label: "Results entered", value: metricValue(metrics?.teacher?.resultsEntered), note: "Results entered by you" },
          { label: "Open exams", value: metricValue(school.openExams), note: `${metricValue(school.exams)} total examinations` },
          { label: "Library", value: metricValue(school.library?.titles), note: `${metricValue(school.library?.available)} copies available` },
        ]
      : role === "pupil" && pupilLive
        ? [
            { label: "Attendance", value: pupilLive.attendanceRate == null ? "Not recorded" : `${pupilLive.attendanceRate}%`, note: pupilLive.attendanceRecorded ? `${pupilLive.attendanceRecorded} attendance record${pupilLive.attendanceRecorded === 1 ? "" : "s"}` : "Awaiting school records" },
            { label: "Subjects", value: pupilLive.subjectsCount == null ? "Not recorded" : pupilLive.subjectsCount, note: pupilLive.subjectsCount == null ? "Awaiting enrolment data" : "Current learning records" },
            { label: "Results", value: data?.results?.count ?? 0, note: data?.results?.count ? `${data.results.average ?? 0}% average` : "Awaiting assessment data" },
            { label: "Average", value: pupilLive.average == null ? "Not recorded" : `${pupilLive.average}%`, note: pupilLive.average == null ? "Awaiting assessment data" : "Live exam results" },
            { label: "Class learning", value: metricValue(metrics?.pupil?.publishedLearning), note: "Published resources for your class" },
          ]
        : stats;

  return <>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Live school snapshot</p><h3 className="mt-1 text-xl font-black text-blue-950">School operations</h3><p className="mt-1 text-sm text-slate-500">Every figure is calculated from current school records.</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Live data</span></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{displayStats.map((stat) => <div key={stat.label} className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-black text-blue-950">{stat.value ?? "—"}</p>{stat.note && <p className="mt-1 text-xs text-slate-500">{stat.note}</p>}</div>)}</div>
    </section>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{actions.map(([label, href]) => <Link key={href} to={href} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-blue-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50">{label}<span className="ml-2">→</span></Link>)}</section>
  </>;
}
