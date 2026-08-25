const express = require("express");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const ExamResult = require("../models/ExamResult");
const Exam = require("../models/Exam");
const FeePayment = require("../models/FeePayment");
const InventoryItem = require("../models/InventoryItem");
const SchoolEvent = require("../models/SchoolEvent");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

const router = express.Router();
const admin = requireSchoolRole("admin");

router.get("/school", requireSchoolAuth, admin, async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const tomorrow = new Date(start);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const [roles, attendance, results, payments, lowStock, events, classes, subjects, openExams] = await Promise.all([
      User.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
      Attendance.aggregate([{ $match: { date: { $gte: start, $lt: tomorrow } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      ExamResult.find({ createdAt: { $gte: monthStart } }).populate("pupil", "name").populate("subject", "name code").populate("exam", "name").sort({ createdAt: -1 }).limit(100).lean(),
      FeePayment.find({ status: "completed", receivedAt: { $gte: monthStart } }).populate("pupil", "name").sort({ receivedAt: -1 }).limit(100).lean(),
      InventoryItem.find({ isActive: true, $expr: { $lte: ["$quantity", "$minimumStock"] } }).sort({ quantity: 1, name: 1 }).limit(100).lean(),
      SchoolEvent.find({ isPublished: true, startAt: { $gte: start } }).sort({ startAt: 1 }).limit(10).lean(),
      SchoolClass.countDocuments({ isActive: true }),
      Subject.countDocuments({ isActive: true }),
      Exam.countDocuments({ status: "open" }),
    ]);
    const roleCounts = Object.fromEntries(roles.map((r) => [r._id, r.count]));
    const attendanceCounts = Object.fromEntries(attendance.map((r) => [r._id, r.count]));
    const collected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const resultTotals = results.reduce((a, r) => ({ marks: a.marks + Number(r.marks || 0), maxMarks: a.maxMarks + Number(r.maxMarks || 0) }), { marks: 0, maxMarks: 0 });
    return res.json({ success: true, generatedAt: new Date().toISOString(), summary: { pupils: roleCounts.pupil || 0, teachers: roleCounts.teacher || 0, parents: roleCounts.parent || 0, sponsors: roleCounts.sponsor || 0, classes, subjects, openExams, attendanceToday: attendanceCounts, attendanceRate: Object.values(attendanceCounts).reduce((a, b) => a + b, 0) ? Math.round(((attendanceCounts.present || 0) / Object.values(attendanceCounts).reduce((a, b) => a + b, 0)) * 100) : null, monthlyCollected: collected, monthlyPayments: payments.length, monthlyResults: results.length, monthlyAverage: resultTotals.maxMarks ? Math.round((resultTotals.marks / resultTotals.maxMarks) * 100) : null, lowStockCount: lowStock.length, upcomingEvents: events.length }, results, payments, lowStock, events });
  } catch (error) { next(error); }
});

module.exports = router;
