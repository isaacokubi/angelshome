const express = require("express");
const User = require("../models/User");
const Notification = require("../models/Notification");
const StudentAcademicRecord = require("../models/StudentAcademicRecord");
const LearningRecord = require("../models/LearningRecord");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

const router = express.Router();
const roleLabels = { admin: "Administrator", teacher: "Teacher", pupil: "Pupil", sponsor: "Sponsor", parent: "Parent" };
const formatStat = (value, empty = "Not recorded") => value === null || value === undefined ? empty : value;

router.get("/dashboard", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    const [counts, notifications, academic] = await Promise.all([
      User.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
      Notification.find({ $or: [{ recipient: user._id }, { audience: "all" }, { audience: user.role }] }).sort({ createdAt: -1 }).limit(5).lean(),
      user.role === "pupil" ? StudentAcademicRecord.findOne({ pupil: user._id }).lean() : null,
    ]);
    const countMap = Object.fromEntries(counts.map((item) => [item._id, item.count]));
    let stats;
    if (user.role === "pupil") stats = [{ label: "Attendance", value: academic?.attendanceRate == null ? "Not recorded" : `${academic.attendanceRate}%`, note: academic?.attendanceRate == null ? "Awaiting school records" : "Recorded in school system" }, { label: "Subjects", value: formatStat(academic?.subjectsCount), note: academic?.subjectsCount == null ? "Awaiting enrolment data" : "Current academic record" }, { label: "Assignments", value: formatStat(academic?.assignmentsDue), note: academic?.assignmentsDue == null ? "No assignment data" : "Currently due" }, { label: "Average", value: academic?.averageScore == null ? "Not recorded" : `${academic.averageScore}%`, note: academic?.averageScore == null ? "Awaiting assessment data" : "Current academic record" }];
    else if (user.role === "teacher") stats = [{ label: "Pupils", value: countMap.pupil || 0, note: "Active pupil accounts" }, { label: "Teachers", value: countMap.teacher || 0, note: "Active teacher accounts" }, { label: "Parents", value: countMap.parent || 0, note: "Active parent accounts" }, { label: "Notifications", value: notifications.length, note: "Recent portal updates" }];
    else if (user.role === "sponsor") stats = [{ label: "Active pupils", value: countMap.pupil || 0, note: "School-wide total" }, { label: "Teachers", value: countMap.teacher || 0, note: "School-wide total" }, { label: "Notifications", value: notifications.length, note: "Recent portal updates" }, { label: "Account status", value: user.isActive ? "Active" : "Inactive", note: "Current account status" }];
    else stats = [{ label: "Pupils", value: countMap.pupil || 0, note: "Active accounts" }, { label: "Teachers", value: countMap.teacher || 0, note: "Active accounts" }, { label: "Sponsors", value: countMap.sponsor || 0, note: "Active accounts" }, { label: "Parents", value: countMap.parent || 0, note: "Active accounts" }];
    return res.json({ success: true, profile: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, roleLabel: roleLabels[user.role] || user.role }, stats, notifications });
  } catch (error) { next(error); }
});

router.get("/learning", requireSchoolAuth, async (req, res, next) => {
  try {
    if (req.schoolUser.role !== "pupil") return res.status(403).json({ success: false, message: "Learning records are available to pupils" });
    const records = await LearningRecord.find({ pupil: req.schoolUser._id }).populate("teacher", "name").sort({ subject: 1 }).lean();
    return res.json({ success: true, records });
  } catch (error) { next(error); }
});

router.get("/users", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const allowedRoles = ["pupil", "teacher", "sponsor", "parent"];
    const role = allowedRoles.includes(req.query.role) ? req.query.role : null;
    const filter = { isActive: true, ...(role ? { role } : {}) };
    const users = await User.find(filter).select("name email role phone isActive createdAt").sort({ name: 1 }).lean();
    return res.json({ success: true, users });
  } catch (error) { next(error); }
});

module.exports = router;
