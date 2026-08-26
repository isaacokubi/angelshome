require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDatabase = require("../config/database");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");
const SchoolClass = require("../models/SchoolClass");

const YEAR = "2026";
const TERM = "Term 1";
const PASSWORD = "ChangeMe123!";

function nairobiCalendarDateAsUtcMidnight(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

async function run() {
  await connectDatabase();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const pupils = await User.find({ role: "pupil", isActive: true }).sort({ email: 1 }).limit(10).lean();
  if (pupils.length < 10) throw new Error(`Expected at least 10 active pupils, found ${pupils.length}.`);

  const sponsors = [];
  for (let i = 0; i < 10; i += 1) {
    const name = `Sponsor ${String(i + 1).padStart(2, "0")}`;
    const email = `sponsor${i + 1}@angelshome.test`;
    const sponsor = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        role: "sponsor",
        phone: `+254740000${String(i + 1).padStart(3, "0")}`,
        passwordHash,
        sponsoredPupils: [pupils[i % pupils.length]._id],
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    sponsors.push(sponsor);
  }

  const exams = await Exam.find({ academicYear: YEAR, term: TERM }).sort({ createdAt: 1 });
  if (!exams.length) throw new Error(`No ${YEAR} ${TERM} examinations were found.`);
  const opened = await Exam.updateMany(
    { academicYear: YEAR, term: TERM },
    { $set: { status: "open" } }
  );

  const classes = await SchoolClass.find({ academicYear: YEAR, isActive: true }).sort({ name: 1 }).limit(20).lean();
  if (classes.length < 10) throw new Error(`Expected at least 10 active classes, found ${classes.length}.`);
  const classIds = new Set(classes.map((schoolClass) => String(schoolClass._id)));

  const today = nairobiCalendarDateAsUtcMidnight();
  const statuses = ["present", "present", "late", "present", "absent", "present", "sick", "present", "late", "present"];
  const attendanceRows = [];

  // Rebuild today's dashboard attendance slice from each pupil's actual classId.
  // Never infer a pupil's class from array position; doing so caused mismatched
  // records such as a Grade 10 pupil appearing in Grade 1/Grade 10 registers.
  await Attendance.deleteMany({ date: today });
  for (let index = 0; index < pupils.length; index += 1) {
    const pupil = pupils[index];
    const schoolClass = classes.find((item) => String(item._id) === String(pupil.classId)) || null;
    if (!schoolClass || !classIds.has(String(pupil.classId))) continue;
    attendanceRows.push({
      pupil: pupil._id,
      schoolClass: schoolClass._id,
      date: today,
      status: statuses[index % statuses.length],
      note: "Live dashboard seed attendance record.",
      recordedBy: schoolClass.classTeacher || null,
    });
  }
  if (attendanceRows.length) await Attendance.insertMany(attendanceRows);

  const activityTitles = [
    "School timetable updated",
    "Attendance register published",
    "New learning material available",
    "Assessment window opened",
    "Parent communication update",
    "Library resources refreshed",
    "Teacher lesson plan published",
    "School operations notice",
    "Academic progress update",
    "Welcome to the school portal",
  ];
  for (let i = 0; i < activityTitles.length; i += 1) {
    await Notification.findOneAndUpdate(
      { audience: "all", title: activityTitles[i] },
      {
        audience: "all",
        title: activityTitles[i],
        message: `Live school activity record ${i + 1} for the Angels Home Education Centre portal.`,
        channel: "in_app",
        kind: "general",
        readAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const openCount = await Exam.countDocuments({ academicYear: YEAR, term: TERM, status: "open" });
  const sponsorCount = await User.countDocuments({ role: "sponsor", isActive: true });
  const todayAttendance = await Attendance.countDocuments({ date: today });
  const activityCount = await Notification.countDocuments({ audience: "all" });

  console.log(JSON.stringify({
    success: true,
    sponsorsCreatedOrUpdated: sponsors.length,
    activeSponsors: sponsorCount,
    examinationsOpened: opened.modifiedCount,
    openExaminations: openCount,
    sponsorPupilLinks: sponsors.length,
    todayAttendanceRecords: todayAttendance,
    expectedTodayAttendanceRecords: pupils.length,
    skippedAttendanceWithoutClass: pupils.length - attendanceRows.length,
    activityNotifications: activityCount,
    attendanceDate: today.toISOString().slice(0, 10),
    attendanceTimezone: "Africa/Nairobi",
    message: "Dashboard sponsor, examination, attendance and school-activity metrics now align with live pupil class assignments.",
  }, null, 2));

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Metrics alignment seed failed:", error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
