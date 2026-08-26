const express = require("express");
const Attendance = require("../models/Attendance");
const SchoolClass = require("../models/SchoolClass");
const Timetable = require("../models/Timetable");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();

router.get("/", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    let filter;

    if (user.role === "admin") {
      filter = {};
    } else if (user.role === "pupil") {
      filter = { pupil: user._id };
    } else if (user.role === "parent") {
      filter = { pupil: { $in: Array.isArray(user.children) ? user.children : [] } };
    } else if (user.role === "sponsor") {
      filter = { pupil: { $in: Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [] } };
    } else if (user.role === "teacher") {
      const year = String(new Date().getFullYear());
      const [timetableClasses, classTeacherClasses] = await Promise.all([
        Timetable.find({ teacher: user._id, academicYear: year, isActive: true }).distinct("schoolClass"),
        SchoolClass.find({ classTeacher: user._id, academicYear: year, isActive: true }).distinct("_id"),
      ]);
      const classIds = [...new Set([...timetableClasses, ...classTeacherClasses].map(String))];
      filter = { schoolClass: { $in: classIds } };
    } else {
      return res.status(403).json({ success: false, message: "Attendance is not available for this account" });
    }

    const records = await Attendance.find(filter)
      .populate("pupil", "name email")
      .populate("schoolClass", "name stream academicYear")
      .sort({ date: -1, createdAt: -1 })
      .limit(1000)
      .lean();

    // One authoritative attendance result per pupil/date. Older seed versions
    // could contain duplicate rows under different class records; keeping the
    // latest row prevents those duplicates from inflating portal totals.
    const unique = new Map();
    records.forEach((record) => {
      const pupilId = record.pupil?._id?.toString() || String(record.pupil || "");
      const dateKey = record.date ? new Date(record.date).toISOString().slice(0, 10) : "unknown";
      const key = `${pupilId}|${dateKey}`;
      if (!unique.has(key)) unique.set(key, record);
    });

    const dedupedRecords = [...unique.values()];
    const summary = dedupedRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({ success: true, records: dedupedRecords, summary });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
