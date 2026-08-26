require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const User = require("../models/User");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");
const SchoolTimetableConfig = require("../models/SchoolTimetableConfig");
const ClassSubjectAllocation = require("../models/ClassSubjectAllocation");

const YEAR = "2026";
const TERM = "Term 1";
const DAYS = [1, 2, 3, 4, 5];
const PERIODS = [
  { period: 1, startTime: "08:00", endTime: "08:40" },
  { period: 2, startTime: "08:40", endTime: "09:20" },
  { period: 3, startTime: "09:20", endTime: "10:00" },
  { period: 4, startTime: "10:20", endTime: "11:00" },
  { period: 5, startTime: "11:00", endTime: "11:40" },
  { period: 6, startTime: "11:40", endTime: "12:20" },
  { period: 7, startTime: "14:00", endTime: "14:40" },
  { period: 8, startTime: "14:40", endTime: "15:20" },
];

const mod = (n, m) => ((n % m) + m) % m;

function chooseTeacher(options, classIndex, dayIndex, periodIndex, usage) {
  const ranked = options.map((teacherId, optionIndex) => ({
    teacherId: String(teacherId),
    score:
      (usage.get(`${teacherId}:${dayIndex}:${periodIndex}`) || 0) * 1000 +
      (usage.get(`${teacherId}:week`) || 0) * 10 +
      mod(optionIndex + classIndex + dayIndex + periodIndex, options.length),
  })).sort((a, b) => a.score - b.score);

  return ranked[0]?.teacherId;
}

async function run() {
  await connectDatabase();

  const [teachers, classes, subjects] = await Promise.all([
    User.find({ role: "teacher", isActive: true }).sort({ email: 1 }).limit(10).lean(),
    SchoolClass.find({ academicYear: YEAR, isActive: true, name: /^Grade (10|[1-9])$/, stream: "A" }).sort({ name: 1 }).lean(),
    Subject.find({ isActive: true, code: /^SUB(?:0[1-9]|10)$/ }).sort({ code: 1 }).lean(),
  ]);

  if (teachers.length < 10) throw new Error(`Expected at least 10 active teachers, found ${teachers.length}.`);
  if (classes.length !== 10) throw new Error(`Expected 10 active Grade 1–10 Stream A classes, found ${classes.length}.`);
  if (subjects.length !== 10) throw new Error(`Expected 10 active SUB01–SUB10 subjects, found ${subjects.length}.`);

  const teacherPoolBySubject = new Map();
  for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex += 1) {
    const pool = [0, 1, 2, 3, 4].map((offset) => teachers[mod(subjectIndex + offset, teachers.length)]._id);
    teacherPoolBySubject.set(String(subjects[subjectIndex]._id), [...new Set(pool.map(String))]);
  }

  // Every class/subject gets five valid teacher options. The scheduler can therefore
  // rotate staff instead of repeatedly locking a subject to one teacher.
  for (const schoolClass of classes) {
    for (const subject of subjects) {
      await ClassSubjectAllocation.findOneAndUpdate(
        { schoolClass: schoolClass._id, subject: subject._id, academicYear: YEAR },
        {
          schoolClass: schoolClass._id,
          subject: subject._id,
          academicYear: YEAR,
          teachers: teacherPoolBySubject.get(String(subject._id)),
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  // Build a deterministic collision-free grid. Each period contains all ten subjects
  // exactly once, while the teacher for each subject rotates by weekday.
  const rows = [];
  const usage = new Map();
  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex += 1) {
    const dayOfWeek = DAYS[dayIndex];
    for (let periodIndex = 0; periodIndex < PERIODS.length; periodIndex += 1) {
      const period = PERIODS[periodIndex];
      const teachersUsed = new Set();

      for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
        const schoolClass = classes[classIndex];
        const subject = subjects[mod(classIndex + dayIndex + periodIndex, subjects.length)];
        const options = teacherPoolBySubject.get(String(subject._id));
        const available = options.filter((id) => !teachersUsed.has(id));
        const teacher = chooseTeacher(available.length ? available : options, classIndex, dayIndex, periodIndex, usage);
        if (!teacher) throw new Error(`Unable to assign teacher for ${schoolClass.name}, ${subject.name}, day ${dayOfWeek}, period ${period.period}.`);
        if (teachersUsed.has(teacher)) throw new Error(`Teacher collision at day ${dayOfWeek}, period ${period.period}.`);

        teachersUsed.add(teacher);
        usage.set(`${teacher}:${dayIndex}:${periodIndex}`, (usage.get(`${teacher}:${dayIndex}:${periodIndex}`) || 0) + 1);
        usage.set(`${teacher}:week`, (usage.get(`${teacher}:week`) || 0) + 1);

        rows.push({
          schoolClass: schoolClass._id,
          stream: schoolClass.stream,
          subject: subject._id,
          teacher,
          dayOfWeek,
          period: period.period,
          startTime: period.startTime,
          endTime: period.endTime,
          room: `Room ${classIndex + 1}`,
          academicYear: YEAR,
          term: TERM,
          isActive: true,
        });
      }

      if (teachersUsed.size !== classes.length) throw new Error(`Teacher collision detected at day ${dayOfWeek}, period ${period.period}.`);
    }
  }

  await Timetable.deleteMany({ academicYear: YEAR, term: TERM });
  await Timetable.insertMany(rows, { ordered: true });

  // Keep the saved builder configuration consistent with the regenerated grid.
  const classPlans = classes.map((schoolClass) => ({
    schoolClass: schoolClass._id,
    lessons: subjects.map((subject) => ({
      subject: subject._id,
      teacher: "",
      lessonsPerWeek: 4,
    })),
  }));

  await SchoolTimetableConfig.findOneAndUpdate(
    { academicYear: YEAR, term: TERM },
    {
      $set: {
        academicYear: YEAR,
        term: TERM,
        periods: PERIODS,
        classPlans,
        generatedAt: new Date(),
        generatedCount: rows.length,
        locked: false,
        lockedAt: null,
        lockedBy: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Verify every day/period has exactly one teacher per class and ten distinct teachers.
  const collisionMap = new Map();
  for (const row of rows) {
    const key = `${row.dayOfWeek}:${row.period}`;
    const teacherKey = `${key}:${row.teacher}`;
    const classKey = `${key}:${row.schoolClass}`;
    if (collisionMap.has(teacherKey)) throw new Error(`Teacher collision detected for ${teacherKey}.`);
    if (collisionMap.has(classKey)) throw new Error(`Class collision detected for ${classKey}.`);
    collisionMap.set(teacherKey, true);
    collisionMap.set(classKey, true);
  }

  console.log(JSON.stringify({
    success: true,
    timetableRows: rows.length,
    days: DAYS.length,
    periodsPerDay: PERIODS.length,
    classes: classes.length,
    subjects: subjects.length,
    teachers: teachers.length,
    teacherOptionsPerClassSubject: 5,
    collisionFree: true,
    message: "Teacher allocations now rotate across the week while preserving one lesson per class and one class per teacher in each period.",
  }, null, 2));

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Teacher rotation seed failed:", error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
