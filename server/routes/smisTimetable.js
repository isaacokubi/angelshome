const express = require("express");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const ClassSubjectAllocation = require("../models/ClassSubjectAllocation");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const User = require("../models/User");
const { getTimetableConfig, generateTimetable, lockTimetable, unlockTimetable, createTimetable, updateTimetable, deleteTimetable } = require("../controllers/smisTimetableGenerationControllerV2");
const { listScopedTimetable } = require("../controllers/scopedTimetableController");

const router = express.Router();
const adminOnly = requireSchoolRole("admin");

router.get("/", requireSchoolAuth, listScopedTimetable);
router.get("/config", requireSchoolAuth, adminOnly, getTimetableConfig);
router.post("/generate", requireSchoolAuth, adminOnly, generateTimetable);
router.post("/lock", requireSchoolAuth, adminOnly, lockTimetable);
router.post("/unlock", requireSchoolAuth, adminOnly, unlockTimetable);
router.post("/", requireSchoolAuth, adminOnly, createTimetable);
router.patch("/:id", requireSchoolAuth, adminOnly, updateTimetable);
router.delete("/:id", requireSchoolAuth, adminOnly, deleteTimetable);

router.get("/allocations", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const academicYear = String(req.query.academicYear || new Date().getFullYear()).trim();
    const allocations = await ClassSubjectAllocation.find({ academicYear, isActive: true })
      .populate("schoolClass", "name stream academicYear")
      .populate("subject", "name code")
      .populate("teachers", "name firstName lastName email")
      .sort({ schoolClass: 1, subject: 1 })
      .lean();
    return res.json({ success: true, allocations });
  } catch (error) { next(error); }
});

router.patch("/allocations/:classId/:subjectId", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const { classId, subjectId } = req.params;
    const academicYear = String(req.body?.academicYear || new Date().getFullYear()).trim();
    const teachers = Array.isArray(req.body?.teachers) ? [...new Set(req.body.teachers.map(String))] : [];
    const schoolClass = await SchoolClass.findOne({ _id: classId, isActive: true, academicYear }).lean();
    if (!schoolClass) return res.status(404).json({ success: false, message: "Active class not found for the selected academic year." });
    const subject = await Subject.findOne({ _id: subjectId, isActive: true }).lean();
    if (!subject) return res.status(404).json({ success: false, message: "Active subject not found." });
    if (!teachers.length) return res.status(400).json({ success: false, message: "Select at least one teacher for this class subject." });
    const validTeachers = await User.find({ _id: { $in: teachers }, role: "teacher", isActive: true }).select("_id").lean();
    if (validTeachers.length !== teachers.length) return res.status(400).json({ success: false, message: "One or more selected teachers are invalid or inactive." });
    const allocation = await ClassSubjectAllocation.findOneAndUpdate(
      { schoolClass: classId, subject: subjectId, academicYear },
      { $set: { teachers, isActive: true, updatedBy: req.schoolUser?._id || null } },
      { upsert: true, new: true, runValidators: true }
    ).populate("schoolClass", "name stream academicYear").populate("subject", "name code").populate("teachers", "name firstName lastName email");
    return res.json({ success: true, allocation });
  } catch (error) { next(error); }
});

router.delete("/allocations/:classId/:subjectId", requireSchoolAuth, adminOnly, async (req, res, next) => {
  try {
    const academicYear = String(req.query.academicYear || new Date().getFullYear()).trim();
    const allocation = await ClassSubjectAllocation.findOneAndUpdate(
      { schoolClass: req.params.classId, subject: req.params.subjectId, academicYear },
      { $set: { isActive: false, teachers: [] } },
      { new: true }
    );
    if (!allocation) return res.status(404).json({ success: false, message: "Class subject allocation not found." });
    return res.json({ success: true, allocation });
  } catch (error) { next(error); }
});

module.exports = router;
