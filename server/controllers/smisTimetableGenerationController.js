const mongoose = require("mongoose");
const Timetable = require("../models/Timetable");
const SchoolTimetableConfig = require("../models/SchoolTimetableConfig");
const Subject = require("../models/Subject");
const SchoolClass = require("../models/SchoolClass");
const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const base = require("./smisTimetableController");

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const slotKey = (day, period) => `${day}:${period}`;
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");

async function resolveTeacher(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (validId(raw)) {
    const byId = await User.findOne({ _id: raw, role: "teacher", isActive: true }).lean();
    if (byId) return byId;
  }
  const profile = await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean();
  if (profile) return User.findOne({ _id: profile.teacher, role: "teacher", isActive: true }).lean();
  return User.findOne({ role: "teacher", isActive: true, $or: [
    { name: new RegExp(`^${escapeRegex(raw)}$`, "i") },
    { email: raw.toLowerCase() },
  ] }).lean();
}

function buildSchedule(tasks, slots) {
  const classBusy = new Set(); const teacherBusy = new Set(); const result = [];
  const classDaySubject = new Map(); const classDayLoad = new Map(); const teacherDayLoad = new Map();
  let nodes = 0; const limit = Math.max(75000, tasks.length * slots.length * 150);
  const candidates = (task) => slots.filter((slot) => { const key = slotKey(slot.dayOfWeek, slot.period); return !classBusy.has(`${task.schoolClass}:${key}`) && !teacherBusy.has(`${task.teacher}:${key}`); });
  const search = (remaining) => {
    if (!remaining.length) return true;
    if (++nodes > limit) return false;
    let chosen = -1; let chosenCandidates = null;
    for (let i = 0; i < remaining.length; i += 1) {
      const next = candidates(remaining[i]);
      if (!next.length) return false;
      if (!chosenCandidates || next.length < chosenCandidates.length) { chosen = i; chosenCandidates = next; if (next.length === 1) break; }
    }
    const task = remaining[chosen];
    chosenCandidates.sort((a, b) => {
      const aSubject = classDaySubject.get(`${task.schoolClass}:${a.dayOfWeek}:${task.subject}`) || 0;
      const bSubject = classDaySubject.get(`${task.schoolClass}:${b.dayOfWeek}:${task.subject}`) || 0;
      const aClass = classDayLoad.get(`${task.schoolClass}:${a.dayOfWeek}`) || 0;
      const bClass = classDayLoad.get(`${task.schoolClass}:${b.dayOfWeek}`) || 0;
      const aTeacher = teacherDayLoad.get(`${task.teacher}:${a.dayOfWeek}`) || 0;
      const bTeacher = teacherDayLoad.get(`${task.teacher}:${b.dayOfWeek}`) || 0;
      return (aSubject * 100 + aTeacher * 10 + aClass) - (bSubject * 100 + bTeacher * 10 + bClass);
    });
    for (const slot of chosenCandidates) {
      const key = slotKey(slot.dayOfWeek, slot.period); const classKey = `${task.schoolClass}:${key}`; const teacherKey = `${task.teacher}:${key}`;
      const subjectKey = `${task.schoolClass}:${slot.dayOfWeek}:${task.subject}`; const classDayKey = `${task.schoolClass}:${slot.dayOfWeek}`; const teacherDayKey = `${task.teacher}:${slot.dayOfWeek}`;
      classBusy.add(classKey); teacherBusy.add(teacherKey); result.push({ ...task, ...slot });
      classDaySubject.set(subjectKey, (classDaySubject.get(subjectKey) || 0) + 1); classDayLoad.set(classDayKey, (classDayLoad.get(classDayKey) || 0) + 1); teacherDayLoad.set(teacherDayKey, (teacherDayLoad.get(teacherDayKey) || 0) + 1);
      if (search(remaining.slice(0, chosen).concat(remaining.slice(chosen + 1)))) return true;
      result.pop(); classBusy.delete(classKey); teacherBusy.delete(teacherKey);
      const s = (classDaySubject.get(subjectKey) || 1) - 1; s ? classDaySubject.set(subjectKey, s) : classDaySubject.delete(subjectKey);
      const c = (classDayLoad.get(classDayKey) || 1) - 1; c ? classDayLoad.set(classDayKey, c) : classDayLoad.delete(classDayKey);
      const t = (teacherDayLoad.get(teacherDayKey) || 1) - 1; t ? teacherDayLoad.set(teacherDayKey, t) : teacherDayLoad.delete(teacherDayKey);
    }
    return false;
  };
  return search([...tasks].sort((a, b) => b.constraints - a.constraints)) ? result : null;
}

const getTimetableConfig = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    if (!academicYear || !term) return res.status(400).json({ success: false, message: "Academic year and term are required." });
    const config = await SchoolTimetableConfig.findOne({ academicYear, term }).lean();
    return res.json({ success: true, config: config || null });
  } catch (error) { console.error("Get timetable config error:", error); return res.status(500).json({ success: false, message: "Unable to load timetable configuration." }); }
};

const generateTimetable = async (req, res) => {
  try {
    const { academicYear, term, classes, slots } = req.body || {};
    if (!academicYear || !term || !Array.isArray(classes) || !Array.isArray(slots) || !classes.length || !slots.length) return res.status(400).json({ success: false, message: "Academic year, term, every class plan and school periods are required." });

    const cleanSlots = slots.map((slot) => ({ dayOfWeek: Number(slot.dayOfWeek), period: Number(slot.period), startTime: String(slot.startTime || "").trim(), endTime: String(slot.endTime || "").trim() }));
    if (cleanSlots.some((slot) => slot.dayOfWeek < 1 || slot.dayOfWeek > 5 || !Number.isInteger(slot.period) || slot.period < 1 || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(slot.startTime) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(slot.endTime) || slot.startTime >= slot.endTime)) return res.status(400).json({ success: false, message: "Every period must have a valid Monday–Friday day and valid start/end times." });
    if (new Set(cleanSlots.map((slot) => slotKey(slot.dayOfWeek, slot.period))).size !== cleanSlots.length) return res.status(400).json({ success: false, message: "Duplicate day/period slots are not allowed." });

    const activeClasses = await SchoolClass.find({ isActive: true, academicYear }).lean();
    const activeIds = new Set(activeClasses.map((item) => String(item._id)));
    const submittedIds = classes.map((item) => String(item.schoolClass));
    if (new Set(submittedIds).size !== submittedIds.length || submittedIds.some((id) => !validId(id) || !activeIds.has(id)) || submittedIds.length !== activeClasses.length) return res.status(400).json({ success: false, message: "The timetable must contain exactly one lesson plan for every active class in the selected academic year." });

    const subjectIds = []; const rawLessons = []; const teacherCache = new Map(); const teacherLoad = new Map(); const problems = [];
    for (const plan of classes) {
      if (!Array.isArray(plan.lessons) || !plan.lessons.length) { problems.push(`Class ${plan.schoolClass} has no lessons.`); continue; }
      const classTotal = plan.lessons.reduce((sum, lesson) => sum + Number(lesson.lessonsPerWeek || 0), 0);
      if (classTotal > cleanSlots.length) problems.push(`Class ${plan.schoolClass} needs ${classTotal} lessons but only ${cleanSlots.length} weekly slots exist.`);
      for (const lesson of plan.lessons) {
        const count = Number(lesson.lessonsPerWeek); const teacherValue = String(lesson.teacher || "").trim();
        if (!validId(lesson.subject) || !Number.isInteger(count) || count < 1 || !teacherValue) { problems.push(`Class ${plan.schoolClass} contains an invalid lesson entry.`); continue; }
        subjectIds.push(lesson.subject); rawLessons.push({ schoolClass: plan.schoolClass, subject: lesson.subject, teacherValue, lessonsPerWeek: count });
      }
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });

    const subjects = await Subject.find({ _id: { $in: [...new Set(subjectIds.map(String))] }, isActive: true }).lean();
    const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject])); const tasks = [];
    for (const lesson of rawLessons) {
      const subject = subjectMap.get(String(lesson.subject)); if (!subject) { problems.push(`Subject ${lesson.subject} was not found or is inactive.`); continue; }
      const key = lesson.teacherValue.toLowerCase(); if (!teacherCache.has(key)) teacherCache.set(key, await resolveTeacher(lesson.teacherValue));
      const teacher = teacherCache.get(key); if (!teacher) { problems.push(`Teacher '${lesson.teacherValue}' was not found.`); continue; }
      if (!subject.teachers?.some((id) => String(id) === String(teacher._id))) { problems.push(`${teacher.name || teacher.email} is not allocated to ${subject.name}.`); continue; }
      const nextLoad = (teacherLoad.get(String(teacher._id)) || 0) + lesson.lessonsPerWeek; teacherLoad.set(String(teacher._id), nextLoad);
      if (nextLoad > cleanSlots.length) problems.push(`${teacher.name || teacher.email} is assigned ${nextLoad} lessons but only ${cleanSlots.length} periods are available per week.`);
      for (let i = 0; i < lesson.lessonsPerWeek; i += 1) tasks.push({ schoolClass: String(lesson.schoolClass), subject: String(subject._id), teacher: String(teacher._id), subjectName: subject.name, teacherName: teacher.name || teacher.email, constraints: lesson.lessonsPerWeek });
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });

    const assignments = buildSchedule(tasks, cleanSlots);
    if (!assignments) return res.status(409).json({ success: false, message: "No collision-free timetable could be found. Add more periods, reduce weekly lessons, or allocate subjects to additional teachers." });
    const rows = assignments.map((item) => ({ schoolClass: item.schoolClass, subject: item.subject, teacher: item.teacher, dayOfWeek: item.dayOfWeek, period: item.period, startTime: item.startTime, endTime: item.endTime, academicYear, term, isActive: true }));

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await Timetable.deleteMany({ academicYear, term }, { session });
      await Timetable.insertMany(rows, { session, ordered: true });
      await SchoolTimetableConfig.findOneAndUpdate({ academicYear, term }, { $set: { periods: [...new Map(cleanSlots.map((slot) => [slot.period, { period: slot.period, startTime: slot.startTime, endTime: slot.endTime }])).values()], classPlans: classes, generatedAt: new Date(), generatedCount: rows.length, updatedBy: req.schoolUser?._id || null } }, { upsert: true, new: true, runValidators: true, session });
      await session.commitTransaction();
    } catch (error) { await session.abortTransaction(); throw error; } finally { await session.endSession(); }

    const created = await base.listTimetableData(academicYear, term);
    return res.status(201).json({ success: true, count: rows.length, data: created, message: `Generated ${rows.length} lessons for all ${activeClasses.length} active classes with no class or teacher collisions.` });
  } catch (error) {
    console.error("Generate timetable error:", error);
    return res.status(error?.code === 11000 ? 409 : 500).json({ success: false, message: error?.code === 11000 ? "The generated timetable contains a duplicate class or teacher period." : "Unable to generate timetable." });
  }
};

module.exports = { ...base, getTimetableConfig, generateTimetable };
