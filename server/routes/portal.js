const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const StudentAcademicRecord = require("../models/StudentAcademicRecord");
const LearningRecord = require("../models/LearningRecord");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

const router = express.Router();
const roleLabels = { admin: "Administrator", teacher: "Teacher", pupil: "Pupil", sponsor: "Sponsor", parent: "Parent" };
const formatStat = (value, empty = "Not recorded") => value === null || value === undefined ? empty : value;
const validObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

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
  return pupils.map((pupil) => ({
    ...pupil,
    academic: academicMap[pupil._id.toString()] || null,
    learning: learningMap[pupil._id.toString()] || { subjects: 0, averageProgress: null },
  }));
}

router.get("/dashboard", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    const [counts, notifications, unreadNotifications, academic] = await Promise.all([
      User.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
      Notification.find({ $or: [{ recipient: user._id }, { audience: "all" }, { audience: user.role }] }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.countDocuments({ $or: [{ recipient: user._id }, { audience: "all" }, { audience: user.role }], readAt: null }),
      user.role === "pupil" ? StudentAcademicRecord.findOne({ pupil: user._id }).lean() : null,
    ]);

    const countMap = Object.fromEntries(counts.map((item) => [item._id, item.count]));
    let children = [];
    let sponsoredPupils = [];

    if (user.role === "parent") children = await buildPupilSummaries(user.children || []);
    if (user.role === "sponsor") sponsoredPupils = await buildPupilSummaries(user.sponsoredPupils || []);

    let stats;
    if (user.role === "pupil") {
      stats = [
        { label: "Attendance", value: academic?.attendanceRate == null ? "Not recorded" : `${academic.attendanceRate}%`, note: academic?.attendanceRate == null ? "Awaiting school records" : "Recorded in school system" },
        { label: "Subjects", value: formatStat(academic?.subjectsCount), note: academic?.subjectsCount == null ? "Awaiting enrolment data" : "Current academic record" },
        { label: "Assignments", value: formatStat(academic?.assignmentsDue), note: academic?.assignmentsDue == null ? "No assignment data" : "Currently due" },
        { label: "Average", value: academic?.averageScore == null ? "Not recorded" : `${academic.averageScore}%`, note: academic?.averageScore == null ? "Awaiting assessment data" : "Current academic record" },
      ];
    } else if (user.role === "teacher") {
      const teacherSubjects = await LearningRecord.countDocuments({ teacher: user._id });
      stats = [
        { label: "Pupils", value: countMap.pupil || 0, note: "Active pupil accounts" },
        { label: "My teaching records", value: teacherSubjects, note: "Subjects assigned to you" },
        { label: "Parents", value: countMap.parent || 0, note: "Active parent accounts" },
        { label: "Notifications", value: unreadNotifications, note: "Unread portal updates" },
      ];
    } else if (user.role === "sponsor") {
      stats = [
        { label: "My pupils", value: sponsoredPupils.length, note: sponsoredPupils.length ? "Linked pupils" : "Awaiting school linkage" },
        { label: "School pupils", value: countMap.pupil || 0, note: "Active school accounts" },
        { label: "Notifications", value: unreadNotifications, note: "Unread portal updates" },
        { label: "Account status", value: user.isActive ? "Active" : "Inactive", note: "Current account status" },
      ];
    } else if (user.role === "parent") {
      stats = [
        { label: "My children", value: children.length, note: children.length ? "Linked pupil accounts" : "Awaiting school linkage" },
        { label: "School updates", value: notifications.length, note: "Recent announcements and alerts" },
        { label: "Unread", value: unreadNotifications, note: "Notifications requiring your attention" },
        { label: "Account status", value: user.isActive ? "Active" : "Inactive", note: "Current portal account" },
      ];
    } else {
      stats = [
        { label: "Pupils", value: countMap.pupil || 0, note: "Active accounts" },
        { label: "Teachers", value: countMap.teacher || 0, note: "Active accounts" },
        { label: "Sponsors", value: countMap.sponsor || 0, note: "Active accounts" },
        { label: "Parents", value: countMap.parent || 0, note: "Active accounts" },
      ];
    }

    return res.json({
      success: true,
      profile: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, roleLabel: roleLabels[user.role] || user.role },
      stats,
      notifications,
      unreadNotifications,
      children,
      sponsoredPupils,
    });
  } catch (error) { next(error); }
});

router.get("/learning", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    let records;
    if (user.role === "pupil") {
      records = await LearningRecord.find({ pupil: user._id }).populate("teacher", "name").sort({ subject: 1 }).lean();
    } else if (user.role === "teacher") {
      records = await LearningRecord.find({ teacher: user._id }).populate("pupil", "name email").sort({ subject: 1, createdAt: -1 }).lean();
    } else if (user.role === "parent") {
      const children = Array.isArray(user.children) ? user.children : [];
      records = await LearningRecord.find({ pupil: { $in: children } }).populate("pupil", "name").populate("teacher", "name").sort({ subject: 1 }).lean();
    } else if (user.role === "sponsor") {
      const sponsored = Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [];
      records = await LearningRecord.find({ pupil: { $in: sponsored } }).populate("pupil", "name").populate("teacher", "name").sort({ subject: 1 }).lean();
    } else {
      return res.status(403).json({ success: false, message: "Learning records are not available for this role" });
    }
    return res.json({ success: true, records });
  } catch (error) { next(error); }
});

router.get("/users", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const allowedRoles = ["pupil", "teacher", "sponsor", "parent"];
    const role = allowedRoles.includes(req.query.role) ? req.query.role : null;
    const filter = { isActive: true, ...(role ? { role } : {}) };
    const users = await User.find(filter).select("name email role phone isActive createdAt children sponsoredPupils").sort({ name: 1 }).lean();
    return res.json({ success: true, users });
  } catch (error) { next(error); }
});

router.get("/relationships", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const [parents, sponsors, pupils] = await Promise.all([
      User.find({ role: "parent", isActive: true }).select("name email phone children").populate("children", "name email").sort({ name: 1 }).lean(),
      User.find({ role: "sponsor", isActive: true }).select("name email phone sponsoredPupils").populate("sponsoredPupils", "name email").sort({ name: 1 }).lean(),
      User.find({ role: "pupil", isActive: true }).select("name email phone").sort({ name: 1 }).lean(),
    ]);
    return res.json({ success: true, parents, sponsors, pupils });
  } catch (error) { next(error); }
});

router.post("/relationships", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const { type, userId, pupilId } = req.body || {};
    if (!["parent", "sponsor"].includes(type) || !validObjectId(userId) || !validObjectId(pupilId)) return res.status(400).json({ success: false, message: "A valid relationship type, account and pupil are required" });
    const [account, pupil] = await Promise.all([User.findById(userId), User.findById(pupilId)]);
    if (!account || !pupil || account.role !== type || pupil.role !== "pupil") return res.status(404).json({ success: false, message: "The selected account or pupil was not found" });
    const field = type === "parent" ? "children" : "sponsoredPupils";
    if (!account[field].some((id) => id.toString() === pupil._id.toString())) account[field].push(pupil._id);
    await account.save();
    return res.status(201).json({ success: true, message: `${type === "parent" ? "Parent" : "Sponsor"} linked to pupil`, relationship: { type, userId: account._id, pupilId: pupil._id } });
  } catch (error) { next(error); }
});

router.delete("/relationships", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const { type, userId, pupilId } = req.body || {};
    if (!["parent", "sponsor"].includes(type) || !validObjectId(userId) || !validObjectId(pupilId)) return res.status(400).json({ success: false, message: "A valid relationship type, account and pupil are required" });
    const account = await User.findOne({ _id: userId, role: type });
    if (!account) return res.status(404).json({ success: false, message: "The selected account was not found" });
    const field = type === "parent" ? "children" : "sponsoredPupils";
    account[field] = account[field].filter((id) => id.toString() !== pupilId);
    await account.save();
    return res.json({ success: true, message: "Relationship removed" });
  } catch (error) { next(error); }
});

module.exports = router;
