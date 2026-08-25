const express = require("express");
const Attendance = require("../models/Attendance");
const SchoolClass = require("../models/SchoolClass");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();

router.get("/", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    let filter;

    if (user.role === "admin") {
      // Administrators are authorised to view the complete school register.
      filter = {};
    } else if (user.role === "pupil") {
      filter = { pupil: user._id };
    } else if (user.role === "parent") {
      filter = { pupil: { $in: Array.isArray(user.children) ? user.children : [] } };
    } else if (user.role === "sponsor") {
      filter = { pupil: { $in: Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [] } };
    } else if (user.role === "teacher") {
      // Teachers can only view attendance for active classes where they are
      // assigned as the class teacher. This prevents the portal endpoint from
      // exposing another teacher's register.
      const classes = await SchoolClass.find({
        classTeacher: user._id,
        isActive: true,
      }).select("_id").lean();

      filter = { schoolClass: { $in: classes.map((schoolClass) => schoolClass._id) } };
    } else {
      return res.status(403).json({
        success: false,
        message: "Attendance is not available for this account",
      });
    }

    const records = await Attendance.find(filter)
      .populate("pupil", "name email")
      .populate("schoolClass", "name stream")
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .lean();

    const summary = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({ success: true, records, summary });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
