const express = require("express");
const Attendance = require("../models/Attendance");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();

router.get("/", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    let filter = {};
    if (user.role === "pupil") filter.pupil = user._id;
    else if (user.role === "parent") filter.pupil = { $in: Array.isArray(user.children) ? user.children : [] };
    else if (user.role === "sponsor") filter.pupil = { $in: Array.isArray(user.sponsoredPupils) ? user.sponsoredPupils : [] };
    const records = await Attendance.find(filter)
      .populate("pupil", "name email")
      .populate("schoolClass", "name stream")
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .lean();
    const summary = records.reduce((acc, record) => { acc[record.status] = (acc[record.status] || 0) + 1; return acc; }, {});
    return res.json({ success: true, records, summary });
  } catch (error) { next(error); }
});

module.exports = router;
