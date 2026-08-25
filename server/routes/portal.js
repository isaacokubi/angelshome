const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const StudentAcademicRecord = require("../models/StudentAcademicRecord");
const LearningRecord = require("../models/LearningRecord");
const Attendance = require("../models/Attendance");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

const router = express.Router();
const roleLabels = { admin: "Administrator", teacher: "Teacher", pupil: "Pupil", sponsor: "Sponsor", parent: "Parent" };
const formatStat = (value, empty = "Not recorded") => value === null || value === undefined ? empty : value;
const validObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

async function schoolSnapshot() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const [users, classes, subjects, attendance, openExams, resultsToday, totalResults] = await Promise.all([
    User.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
    SchoolClass.countDocuments({ isActive: true }),
    Subject.countDocuments({ isActive: true }),
    Attendance.aggregate([{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Exam.countDocuments({ status: "open" }),
    ExamResult.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    ExamResult.countDocuments(),
  ]);
  const counts = Object.fromEntries(users.map((x) => [x._id, x.count]));
  const attendanceToday = Object.fromEntries(attendance.map((x) => [x._id, x.count]));
  const totalMarked = Object.values(attendanceToday).reduce((sum, value) => sum + value, 0);
  return { pupils: counts.pupil || 0, teachers: counts.teacher || 0, parents: counts.parent || 0, sponsors: counts.sponsor || 0, classes, subjects, openExams, resultsEnteredToday: resultsToday, totalResults, attendanceToday: { ...attendanceToday, totalMarked, attendanceRate: totalMarked ? Math.round(((attendanceToday.present || 0) / totalMarked) * 100) : null } };
}

async function buildPupilSummaries(pupilIds) {
  const ids = pupilIds.filter(validObjectId);
  if (!ids.length) return [];
  const [pupils, academicRecords, learningCounts] = await Promise.all([
    User.find({ _id: { $in: ids }, role: "pupil", isActive: true }).select("name email phone createdAt").sort({ name: 1 }).lean(),
    StudentAcademicRecord.find({ pupil: { $in: ids } }).lean(),
    LearningRecord.aggregate([{ $match: { pupil: { $in: ids } } }, { $group: { _id: "$pupil", subjects: { $sum: 1 }, averageProgress: { $avg: "$progress" } } }]),
  ]);
  const academicMap = Object.fromEntries(academicRecords.map((record) => [record.pupil.toString(), record]));
  const learningMap = Object.fromEntries(learningCounts.map((record) => [record._id.toString(), record]));
  return pupils.map((pupil) => ({ ...pupil, academic: academicMap[pupil._id.toString()] || null, learning: learningMap[pupil._id.toString()] || { subjects: 0, averageProgress: null } }));
}

async function resultSnapshot(user) {
  let pupilIds = null;
  if (user.role === "pupil") pupilIds = [user._id];
  if (user.role === "parent") pupilIds = Array.isArray(user.children) ? user.children : [];
  if (user.role === "sponsor") pupilIds = Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [];
  const filter = pupilIds ? { pupil: { $in: pupilIds.filter(validObjectId) } } : {};
  const [count, aggregate, recent] = await Promise.all([
    ExamResult.countDocuments(filter),
    ExamResult.aggregate([{ $match: filter }, { $group: { _id: null, totalMarks: { $sum: "$marks" }, totalMaxMarks: { $sum: "$maxMarks" }, subjects: { $addToSet: "$subject" } } }]),
    ExamResult.find(filter).populate("exam", "name term academicYear").populate("pupil", "name").populate("subject", "name code").sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  const totals = aggregate[0] || { totalMarks: 0, totalMaxMarks: 0, subjects: [] };
  const average = totals.totalMaxMarks ? Math.round((totals.totalMarks / totals.totalMaxMarks) * 100) : null;
  return { count, subjects: totals.subjects.length, average, recent };
}

router.get("/dashboard", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    const [school, notifications, unreadNotifications, academic, results] = await Promise.all([
      schoolSnapshot(),
      Notification.find({ $or: [{ recipient: user._id }, { audience: "all" }, { audience: user.role }] }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.countDocuments({ $or: [{ recipient: user._id }, { audience: "all" }, { audience: user.role }], readAt: null }),
      user.role === "pupil" ? StudentAcademicRecord.findOne({ pupil: user._id }).lean() : null,
      resultSnapshot(user),
    ]);
    let children = [], sponsoredPupils = [];
    if (user.role === "parent") children = await buildPupilSummaries(user.children || []);
    if (user.role === "sponsor") sponsoredPupils = await buildPupilSummaries(user.sponsoredPupils || []);
    if (user.role === "pupil") results.children = [];
    let stats;
    if (user.role === "pupil") stats = [
      { label: "Attendance", value: academic?.attendanceRate == null ? "Not recorded" : `${academic.attendanceRate}%`, note: academic?.attendanceRate == null ? "Awaiting school records" : "Recorded in school system" },
      { label: "Subjects", value: formatStat(academic?.subjectsCount), note: academic?.subjectsCount == null ? "Awaiting enrolment data" : "Current academic record" },
      { label: "Results", value: results.count, note: results.count ? `${results.average}% average` : "Awaiting assessment data" },
      { label: "Average", value: results.average == null ? "Not recorded" : `${results.average}%`, note: results.average == null ? "Awaiting assessment data" : "Live exam results" },
    ];
    else if (user.role === "teacher") stats = [
      { label: "Pupils", value: school.pupils, note: "Active school pupils" }, { label: "Classes", value: school.classes, note: "Active classes" }, { label: "Results", value: results.count, note: "Results in school records" }, { label: "Unread", value: unreadNotifications, note: "Portal notifications" },
    ];
    else if (user.role === "sponsor") stats = [
      { label: "My pupils", value: sponsoredPupils.length, note: sponsoredPupils.length ? "Linked pupils" : "Awaiting school linkage" }, { label: "Results", value: results.count, note: results.count ? `${results.average}% average` : "Awaiting school results" }, { label: "Open exams", value: school.openExams, note: "Currently open" }, { label: "Unread", value: unreadNotifications, note: "Portal notifications" },
    ];
    else if (user.role === "parent") stats = [
      { label: "My children", value: children.length, note: children.length ? "Linked pupil accounts" : "Awaiting school linkage" }, { label: "Results", value: results.count, note: results.count ? `${results.average}% average` : "Awaiting school results" }, { label: "Open exams", value: school.openExams, note: "Currently open" }, { label: "Unread", value: unreadNotifications, note: "Portal notifications" },
    ];
    else stats = [
      { label: "Pupils", value: school.pupils, note: "Active accounts" }, { label: "Teachers", value: school.teachers, note: "Active accounts" }, { label: "Results", value: school.totalResults, note: `${school.resultsEnteredToday} entered today` }, { label: "Open exams", value: school.openExams, note: "Currently open" },
    ];
    return res.json({ success: true, profile: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, roleLabel: roleLabels[user.role] || user.role }, stats, school, results, notifications, unreadNotifications, children, sponsoredPupils });
  } catch (error) { next(error); }
});

router.get("/results", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    const filter = {};
    if (user.role === "pupil") filter.pupil = user._id;
    if (user.role === "parent") filter.pupil = { $in: Array.isArray(user.children) ? user.children : [] };
    if (user.role === "sponsor") filter.pupil = { $in: Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [] };
    if (req.query.exam && validObjectId(req.query.exam)) filter.exam = req.query.exam;
    if (req.query.pupil && validObjectId(req.query.pupil) && ["admin", "teacher"].includes(user.role)) filter.pupil = req.query.pupil;
    const results = await ExamResult.find(filter).populate("exam", "name type term academicYear").populate("pupil", "name email").populate("subject", "name code").sort({ createdAt: -1 }).limit(1000).lean();
    const totals = results.reduce((acc, item) => { acc.marks += Number(item.marks || 0); acc.maxMarks += Number(item.maxMarks || 0); return acc; }, { marks: 0, maxMarks: 0 });
    return res.json({ success: true, results, summary: { count: results.length, subjects: new Set(results.map((r) => r.subject?._id?.toString()).filter(Boolean)).size, average: totals.maxMarks ? Math.round((totals.marks / totals.maxMarks) * 100) : null } });
  } catch (error) { next(error); }
});

router.get("/learning", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    let records;
    if (user.role === "pupil") records = await LearningRecord.find({ pupil: user._id }).populate("teacher", "name").sort({ subject: 1 }).lean();
    else if (user.role === "teacher") records = await LearningRecord.find({ teacher: user._id }).populate("pupil", "name email").sort({ subject: 1, createdAt: -1 }).lean();
    else if (user.role === "parent") records = await LearningRecord.find({ pupil: { $in: Array.isArray(user.children) ? user.children : [] } }).populate("pupil", "name").populate("teacher", "name").sort({ subject: 1 }).lean();
    else if (user.role === "sponsor") records = await LearningRecord.find({ pupil: { $in: Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [] } }).populate("pupil", "name").populate("teacher", "name").sort({ subject: 1 }).lean();
    else return res.status(403).json({ success: false, message: "Learning records are not available for this role" });
    return res.json({ success: true, records });
  } catch (error) { next(error); }
});

router.get("/users", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try { const allowedRoles = ["pupil", "teacher", "sponsor", "parent"]; const role = allowedRoles.includes(req.query.role) ? req.query.role : null; const filter = { isActive: true, ...(role ? { role } : {}) }; return res.json({ success: true, users: await User.find(filter).select("name email role phone isActive createdAt children sponsoredPupils").sort({ name: 1 }).lean() }); } catch (error) { next(error); }
});

router.get("/relationships", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try { const [parents, sponsors, pupils] = await Promise.all([User.find({ role: "parent", isActive: true }).select("name email phone children").populate("children", "name email").sort({ name: 1 }).lean(), User.find({ role: "sponsor", isActive: true }).select("name email phone sponsoredPupils").populate("sponsoredPupils", "name email").sort({ name: 1 }).lean(), User.find({ role: "pupil", isActive: true }).select("name email phone").sort({ name: 1 }).lean()]); return res.json({ success: true, parents, sponsors, pupils }); } catch (error) { next(error); }
});

router.post("/relationships", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try { const { type, userId, pupilId } = req.body || {}; if (!["parent", "sponsor"].includes(type) || !validObjectId(userId) || !validObjectId(pupilId)) return res.status(400).json({ success: false, message: "A valid relationship type, account and pupil are required" }); const [account, pupil] = await Promise.all([User.findById(userId), User.findById(pupilId)]); if (!account || !pupil || account.role !== type || pupil.role !== "pupil") return res.status(404).json({ success: false, message: "The selected account or pupil was not found" }); const field = type === "parent" ? "children" : "sponsoredPupils"; if (!account[field].some((id) => id.toString() === pupil._id.toString())) account[field].push(pupil._id); await account.save(); return res.status(201).json({ success: true, message: `${type === "parent" ? "Parent" : "Sponsor"} linked to pupil`, relationship: { type, userId: account._id, pupilId: pupil._id } }); } catch (error) { next(error); }
});

router.delete("/relationships", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try { const { type, userId, pupilId } = req.body || {}; if (!["parent", "sponsor"].includes(type) || !validObjectId(userId) || !validObjectId(pupilId)) return res.status(400).json({ success: false, message: "A valid relationship type, account and pupil are required" }); const account = await User.findOne({ _id: userId, role: type }); if (!account) return res.status(404).json({ success: false, message: "The selected account was not found" }); const field = type === "parent" ? "children" : "sponsoredPupils"; account[field] = account[field].filter((id) => id.toString() !== pupilId); await account.save(); return res.json({ success: true, message: "Relationship removed" }); } catch (error) { next(error); }
});

module.exports = router;
