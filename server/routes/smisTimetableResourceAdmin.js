const express = require("express");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const ClassSubjectAllocation = require("../models/ClassSubjectAllocation");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");

const router = express.Router();
const adminOnly = requireSchoolRole("admin");

router.delete("/classes/:id", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const schoolClass = await SchoolClass.findOne({ _id: req.params.id, isActive: true });
    if (!schoolClass) return res.status(404).json({ success: false, message: "Active class not found." });
    const timetableCount = await Timetable.countDocuments({ schoolClass: schoolClass._id, isActive: true });
    if (timetableCount) return res.status(409).json({ success: false, message: "This class has timetable lessons. Remove or replace the timetable before deleting the class." });
    schoolClass.isActive = false;
    await schoolClass.save();
    await ClassSubjectAllocation.updateMany({ schoolClass: schoolClass._id, isActive: true }, { $set: { isActive: false, teachers: [] } });
    return res.json({ success: true, message: "Class deleted successfully." });
  } catch (error) { next(error); }
});

router.delete("/subjects/:id", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: "Active subject not found." });
    const timetableCount = await Timetable.countDocuments({ subject: subject._id, isActive: true });
    if (timetableCount) return res.status(409).json({ success: false, message: "This subject is already used by timetable lessons. Remove or replace the timetable before deleting the subject." });
    subject.isActive = false;
    await subject.save();
    await ClassSubjectAllocation.updateMany({ subject: subject._id, isActive: true }, { $set: { isActive: false, teachers: [] } });
    return res.json({ success: true, message: "Subject deleted successfully." });
  } catch (error) { next(error); }
});

module.exports = router;
