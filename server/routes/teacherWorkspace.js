const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Timetable = require("../models/Timetable");
const LearningRecord = require("../models/LearningRecord");
const Attendance = require("../models/Attendance");
const ExamResult = require("../models/ExamResult");
const Notification = require("../models/Notification");
const SchoolClass = require("../models/SchoolClass");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();

function nairobiDayNumber(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", weekday: "long" }).format(date);
  return { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }[weekday] || 1;
}

function nairobiDayRange(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  const day = `${get("year")}-${get("month")}-${get("day")}`;
  const start = new Date(`${day}T00:00:00+03:00`);
  return { start, end: new Date(start.getTime() + 86400000) };
}

router.get("/", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    if (user.role !== "teacher") return res.status(403).json({ success: false, message: "Teacher workspace is restricted to teacher accounts." });

    const academicYear = String(new Date().getFullYear());
    const dayOfWeek = nairobiDayNumber();
    const { start, end } = nairobiDayRange();

    const timetable = await Timetable.find({ teacher: user._id, academicYear, isActive: true })
      .populate("schoolClass", "name stream academicYear isActive")
      .populate("subject", "name code isActive")
      .populate("teacher", "name firstName lastName email role isActive")
      .sort({ dayOfWeek: 1, period: 1 })
      .lean();

    const validTimetable = timetable.filter((row) => row.schoolClass?.isActive !== false && row.subject?.isActive !== false && row.teacher?.isActive !== false && row.teacher?.role === "teacher");
    const classIds = [...new Set(validTimetable.map((row) => row.schoolClass?._id?.toString()).filter(Boolean))].map((id) => new mongoose.Types.ObjectId(id));

    const [classTeacherClasses, learning, pupils, attendanceRows, results, notifications] = await Promise.all([
      SchoolClass.find({ classTeacher: user._id, academicYear, isActive: true }).select("_id name stream").lean(),
      LearningRecord.find({ teacher: user._id }).populate("pupil", "name email classId").sort({ nextLesson: 1, createdAt: -1 }).limit(200).lean(),
      classIds.length ? User.find({ role: "pupil", isActive: true, classId: { $in: classIds } }).select("_id name email classId").sort({ name: 1 }).lean() : [],
      classIds.length ? Attendance.find({ schoolClass: { $in: classIds }, date: { $gte: start, $lt: end } }).select("pupil schoolClass date status note").lean() : [],
      ExamResult.find({ enteredBy: user._id }).populate("pupil", "name").populate("subject", "name code").populate("exam", "name").sort({ createdAt: -1 }).limit(8).lean(),
      Notification.find({ $or: [{ recipient: user._id }, { audience: "all" }, { audience: "teacher" }] }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const classMap = new Map();
    [...classTeacherClasses, ...validTimetable.map((row) => row.schoolClass).filter(Boolean)].forEach((item) => classMap.set(String(item._id), item));
    const summary = attendanceRows.reduce((acc, row) => { const key = row.status || "unknown"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const attendanceTotal = Object.values(summary).reduce((sum, value) => sum + Number(value || 0), 0);
    const attendanceRate = attendanceTotal ? Math.round((((summary.present || 0) + (summary.late || 0)) / attendanceTotal) * 100) : null;
    const dayLessons = validTimetable.filter((row) => Number(row.dayOfWeek) === dayOfWeek);
    const subjectIds = [...new Set(validTimetable.map((row) => row.subject?._id?.toString()).filter(Boolean))];
    const progressValues = learning.map((record) => Number(record.progress)).filter(Number.isFinite);
    const averageProgress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : null;

    return res.json({
      success: true,
      profile: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, roleLabel: "Teacher" },
      classes: [...classMap.values()],
      pupils,
      learning,
      timetable: dayLessons,
      attendance: { summary, records: attendanceRows, totalMarked: attendanceTotal, attendanceRate },
      results,
      notifications,
      stats: { classes: classMap.size, pupils: pupils.length, subjects: subjectIds.length, lessonsToday: dayLessons.length, learningRecords: learning.length, averageProgress },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) { next(error); }
});

module.exports = router;
