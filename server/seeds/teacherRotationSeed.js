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

  // Every active class/subject receives the complete teacher pool. This is intentional:
  // the scheduler is responsible for rotating teachers and resolving collisions rather
  // than permanently attaching one teacher to one class.
  const teacherIds = teachers.map((teacher) => String(teacher._id));
  for (const schoolClass of classes) {
    for (const subject of subjects) {
      await ClassSubjectAllocation.findOneAndUpdate(
        { schoolClass: schoolClass._id, subject: subject._id, academicYear: YEAR },
        {
          schoolClass: schoolClass._id,
          subject: subject._id,
          academicYear: YEAR,
          teachers: teacherIds,
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  // Build a deterministic 10x8x5 timetable.
  // For every day/period, each of the 10 classes gets one lesson and the 10 teachers
  // are assigned through a cyclic permutation. Therefore a teacher can move between
  // classes from period to period/day to day, but can never teach two classes at once.
  const rows = [];
  const teacherUsage = new Map();

  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex += 1) {
    const dayOfWeek = DAYS[dayIndex];

    for (let periodIndex = 0; periodIndex < PERIODS.length; periodIndex += 1) {
      const period = PERIODS[periodIndex];
      const teachersUsed = new Set();
      const classesUsed = new Set();

      for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
        const schoolClass = classes[classIndex];
        const subjectIndex = mod(classIndex + dayIndex + periodIndex, subjects.length);
        const subject = subjects[subjectIndex];

        // This cyclic assignment guarantees all 10 teachers are used once per period.
        // Day and period offsets make teachers rotate across classes over the week.
        const teacherIndex = mod(classIndex + (dayIndex * 3) + periodIndex, teachers.length);
        const teacher = teacherIds[teacherIndex];

        if (teachersUsed.has(teacher)) {
          throw new Error(`Teacher collision at day ${dayOfWeek}, period ${period.period}.`);
        }
        if (classesUsed.has(String(schoolClass._id))) {
          throw new Error(`Class collision at day ${dayOfWeek}, period ${period.period}.`);
        }

        teachersUsed.add(teacher);
        classesUsed.add(String(schoolClass._id));
        teacherUsage.set(teacher, (teacherUsage.get(teacher) || 0) + 1);

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

      if (teachersUsed.size !== classes.length) {
        throw new Error(`Expected ${classes.length} distinct teachers at day ${dayOfWeek}, period ${period.period}.`);
      }
      if (classesUsed.size !== classes.length) {
        throw new Error(`Expected ${classes.length} distinct classes at day ${dayOfWeek}, period ${period.period}.`);
      }
    }
  }

  await Timetable.deleteMany({ academicYear: YEAR, term: TERM });
  await Timetable.insertMany(rows, { ordered: true });

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

  // Final integrity checks: every class has 40 lessons, every teacher has 40 lessons,
  // and every day/period has ten distinct teachers and ten distinct classes.
  const classCounts = new Map();
  for (const row of rows) {
    const classKey = String(row.schoolClass);
    classCounts.set(classKey, (classCounts.get(classKey) || 0) + 1);
  }
  for (const schoolClass of classes) {
    const count = classCounts.get(String(schoolClass._id)) || 0;
    if (count !== DAYS.length * PERIODS.length) {
      throw new Error(`${schoolClass.name} has ${count} lessons; expected ${DAYS.length * PERIODS.length}.`);
    }
  }

  for (const [teacherId, count] of teacherUsage.entries()) {
    if (count !== DAYS.length * PERIODS.length) {
      throw new Error(`Teacher ${teacherId} has ${count} assignments; expected ${DAYS.length * PERIODS.length}.`);
    }
  }

  console.log(JSON.stringify({
    success: true,
    timetableRows: rows.length,
    days: DAYS.length,
    periodsPerDay: PERIODS.length,
    classes: classes.length,
    subjects: subjects.length,
    teachers: teachers.length,
    teacherOptionsPerClassSubject: teacherIds.length,
    lessonsPerTeacher: DAYS.length * PERIODS.length,
    lessonsPerClass: DAYS.length * PERIODS.length,
    collisionFree: true,
    rotation: true,
    message: "Teachers rotate across classes by day and period. Every period contains exactly one lesson per class and exactly one lesson per teacher.",
  }, null, 2));

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Teacher rotation seed failed:", error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
