const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const PupilProfile = require("../models/PupilProfile");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const { getTeachers, setTeacherCode, allocateSubjectTeachers, createClass } = require("../controllers/adminAcademicController");

const router = express.Router();
const id = (value) => mongoose.Types.ObjectId.isValid(value);
const adminOrTeacher = requireSchoolRole("admin", "teacher");
const adminOnly = requireSchoolRole("admin");

router.get("/dashboard", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const [pupils, parents, teachers, attendanceToday, classes, subjects, openExams, recentResults] = await Promise.all([
      User.countDocuments({ role: "pupil", isActive: true }),
      User.countDocuments({ role: "parent", isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      Attendance.aggregate([{ $match: { date: { $gte: today, $lt: tomorrow } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      SchoolClass.countDocuments({ isActive: true }), Subject.countDocuments({ isActive: true }),
      Exam.countDocuments({ status: "open" }), ExamResult.countDocuments({ createdAt: { $gte: today } }),
    ]);
    const attendance = Object.fromEntries(attendanceToday.map((x) => [x._id, x.count]));
    const totalMarked = Object.values(attendance).reduce((a, b) => a + b, 0);
    return res.json({ success: true, stats: { pupils, parents, teachers, classes, subjects, openExams, resultsEnteredToday: recentResults, attendanceToday: { ...attendance, totalMarked, attendanceRate: totalMarked ? Math.round(((attendance.present || 0) / totalMarked) * 100) : null } } });
  } catch (error) { next(error); }
});

router.get("/pupils", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const pupils = await User.find({ role: "pupil", isActive: true }).select("name email phone createdAt").sort({ name: 1 }).lean();
    const profiles = await PupilProfile.find({ pupil: { $in: pupils.map((p) => p._id) } }).populate("schoolClass", "name stream academicYear").lean();
    const map = Object.fromEntries(profiles.map((p) => [p.pupil.toString(), p]));
    return res.json({ success: true, pupils: pupils.map((p) => ({ ...p, profile: map[p._id.toString()] || null })) });
  } catch (error) { next(error); }
});

router.post("/pupils/:pupilId/profile", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const { pupilId } = req.params;
    if (!id(pupilId)) return res.status(400).json({ success: false, message: "Invalid pupil id" });
    const pupil = await User.findOne({ _id: pupilId, role: "pupil" });
    if (!pupil) return res.status(404).json({ success: false, message: "Pupil not found" });
    const payload = { ...req.body, pupil: pupilId };
    const profile = await PupilProfile.findOneAndUpdate({ pupil: pupilId }, payload, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).populate("schoolClass", "name stream academicYear");
    return res.json({ success: true, profile });
  } catch (error) { next(error); }
});

router.get("/teachers", requireSchoolAuth, adminOnly, getTeachers);
router.patch("/teachers/:teacherId/code", requireSchoolAuth, adminOnly, setTeacherCode);
router.patch("/subjects/:subjectId/teachers", requireSchoolAuth, adminOnly, allocateSubjectTeachers);

router.get("/classes", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try { return res.json({ success: true, classes: await SchoolClass.find({ isActive: true }).populate("classTeacher", "name email").sort({ name: 1, stream: 1 }).lean() }); } catch (error) { next(error); }
});
router.post("/classes", requireSchoolAuth, adminOnly, createClass);
router.patch("/classes/:id", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try { const schoolClass = await SchoolClass.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!schoolClass) return res.status(404).json({ success: false, message: "Class not found" }); return res.json({ success: true, class: schoolClass }); } catch (error) { next(error); }
});

router.get("/subjects", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try { return res.json({ success: true, subjects: await Subject.find({ isActive: true }).populate("teachers", "name email").sort({ name: 1 }).lean() }); } catch (error) { next(error); }
});
router.post("/subjects", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try { const subject = await Subject.create(req.body); return res.status(201).json({ success: true, subject }); } catch (error) { next(error); }
});
router.patch("/subjects/:id", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try { const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!subject) return res.status(404).json({ success: false, message: "Subject not found" }); return res.json({ success: true, subject }); } catch (error) { next(error); }
});

router.get("/attendance", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.date) { const date = new Date(req.query.date); date.setHours(0, 0, 0, 0); const end = new Date(date); end.setDate(end.getDate() + 1); filter.date = { $gte: date, $lt: end }; }
    if (req.query.schoolClass && id(req.query.schoolClass)) filter.schoolClass = req.query.schoolClass;
    const records = await Attendance.find(filter).populate("pupil", "name email").populate("schoolClass", "name stream").sort({ date: -1, createdAt: -1 }).limit(500).lean();
    return res.json({ success: true, records });
  } catch (error) { next(error); }
});
router.post("/attendance/bulk", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try {
    const { date, records } = req.body || {};
    if (!date || !Array.isArray(records) || !records.length) return res.status(400).json({ success: false, message: "Date and attendance records are required" });
    const day = new Date(date); day.setHours(0, 0, 0, 0);
    const operations = records.filter((r) => id(r.pupil) && ["present", "absent", "sick", "late"].includes(r.status)).map((r) => ({ updateOne: { filter: { pupil: r.pupil, date: day }, update: { $set: { status: r.status, schoolClass: id(r.schoolClass) ? r.schoolClass : null, note: r.note || "", recordedBy: req.schoolUser._id } }, upsert: true } }));
    const result = await Attendance.bulkWrite(operations);
    return res.json({ success: true, matched: result.matchedCount, upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (error) { next(error); }
});

router.get("/exams", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try { return res.json({ success: true, exams: await Exam.find().populate("createdBy", "name").sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); }
});
router.post("/exams", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try { const exam = await Exam.create({ ...req.body, createdBy: req.schoolUser._id }); return res.status(201).json({ success: true, exam }); } catch (error) { next(error); }
});
router.patch("/exams/:id", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try { const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!exam) return res.status(404).json({ success: false, message: "Exam not found" }); return res.json({ success: true, exam }); } catch (error) { next(error); }
});

router.get("/results", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try {
    const filter = {};
    if (id(req.query.exam)) filter.exam = req.query.exam;
    if (id(req.query.pupil)) filter.pupil = req.query.pupil;
    const results = await ExamResult.find(filter).populate("exam", "name type term academicYear").populate("pupil", "name email").populate("subject", "name code").sort({ createdAt: -1 }).limit(1000).lean();
    return res.json({ success: true, results });
  } catch (error) { next(error); }
});
router.post("/results/bulk", requireSchoolAuth, adminOrTeacher, async (req, res, next) => {
  try {
    const { exam, results } = req.body || {};
    if (!id(exam) || !Array.isArray(results) || !results.length) return res.status(400).json({ success: false, message: "Exam and result records are required" });
    const operations = results.filter((r) => id(r.pupil) && id(r.subject) && Number.isFinite(Number(r.marks))).map((r) => {
      const marks = Number(r.marks); const maxMarks = Number(r.maxMarks) || 100; const percentage = (marks / maxMarks) * 100;
      const grade = percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : percentage >= 50 ? "D" : percentage >= 40 ? "E" : "F";
      return { updateOne: { filter: { exam, pupil: r.pupil, subject: r.subject }, update: { $set: { marks, maxMarks, grade, teacherComment: r.teacherComment || "", enteredBy: req.schoolUser._id } }, upsert: true } };
    });
    const result = await ExamResult.bulkWrite(operations);
    return res.json({ success: true, matched: result.matchedCount, upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (error) { next(error); }
});

module.exports = router;
