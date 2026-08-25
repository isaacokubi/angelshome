const mongoose = require("mongoose");
const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const Subject = require("../models/Subject");
const SchoolClass = require("../models/SchoolClass");
const Timetable = require("../models/Timetable");

const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const getTeachers = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: "teacher", isActive: true })
      .select("name email phone")
      .sort({ name: 1 })
      .lean();
    const profiles = await TeacherProfile.find({ teacher: { $in: teachers.map((t) => t._id) } }).lean();
    const profileMap = new Map(profiles.map((p) => [String(p.teacher), p]));
    return res.json({ success: true, teachers: teachers.map((teacher) => ({ ...teacher, teacherCode: profileMap.get(String(teacher._id))?.teacherCode || "" })) });
  } catch (error) { next(error); }
};

const setTeacherCode = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const teacherCode = String(req.body?.teacherCode || "").trim().toUpperCase();
    if (!validId(teacherId) || !teacherCode) return res.status(400).json({ success: false, message: "Teacher and teacher code are required." });
    const teacher = await User.findOne({ _id: teacherId, role: "teacher", isActive: true });
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found." });
    const existing = await TeacherProfile.findOne({ teacherCode, teacher: { $ne: teacherId } });
    if (existing) return res.status(409).json({ success: false, message: "That teacher code is already assigned." });
    const profile = await TeacherProfile.findOneAndUpdate({ teacher: teacherId }, { teacher: teacherId, teacherCode }, { upsert: true, new: true, runValidators: true });
    return res.json({ success: true, profile });
  } catch (error) { next(error); }
};

const resolveTeacher = async (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (validId(raw)) {
    const teacher = await User.findOne({ _id: raw, role: "teacher", isActive: true }).lean();
    if (teacher) return teacher;
  }
  const profile = await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean();
  if (profile) return User.findOne({ _id: profile.teacher, role: "teacher", isActive: true }).lean();
  return User.findOne({ role: "teacher", isActive: true, $or: [{ name: new RegExp(`^${raw.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i") }, { email: raw.toLowerCase() }] }).lean();
};

const allocateSubjectTeachers = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const teacherValues = Array.isArray(req.body?.teachers) ? req.body.teachers : [];
    if (!validId(subjectId)) return res.status(400).json({ success: false, message: "Invalid subject id." });
    const subject = await Subject.findOne({ _id: subjectId, isActive: true });
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });
    const resolved = [];
    for (const value of teacherValues) {
      const teacher = await resolveTeacher(value);
      if (!teacher) return res.status(400).json({ success: false, message: `Teacher not found: ${value}` });
      if (!resolved.some((item) => String(item._id) === String(teacher._id))) resolved.push(teacher);
    }
    subject.teachers = resolved.map((teacher) => teacher._id);
    await subject.save();
    const populated = await Subject.findById(subject._id).populate("teachers", "name email").lean();
    return res.json({ success: true, subject: populated });
  } catch (error) { next(error); }
};

const createClass = async (req, res, next) => {
  try {
    const { name, stream = "", academicYear, capacity = 40, classTeacher = null } = req.body || {};
    if (!name || !academicYear) return res.status(400).json({ success: false, message: "Class name and academic year are required." });
    if (classTeacher && !validId(classTeacher)) return res.status(400).json({ success: false, message: "Invalid class teacher." });
    if (classTeacher) {
      const teacher = await User.findOne({ _id: classTeacher, role: "teacher", isActive: true });
      if (!teacher) return res.status(400).json({ success: false, message: "Class teacher must be an active teacher." });
    }
    const schoolClass = await SchoolClass.create({ name, stream, academicYear, capacity, classTeacher });
    return res.status(201).json({ success: true, class: schoolClass });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "A class with this name, stream and academic year already exists." });
    next(error);
  }
};

module.exports = { getTeachers, setTeacherCode, allocateSubjectTeachers, createClass, resolveTeacher };
