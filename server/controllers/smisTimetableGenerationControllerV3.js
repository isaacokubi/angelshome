const mongoose = require("mongoose");
const Timetable = require("../models/Timetable");
const SchoolTimetableConfig = require("../models/SchoolTimetableConfig");
const ClassSubjectAllocation = require("../models/ClassSubjectAllocation");
const Subject = require("../models/Subject");
const SchoolClass = require("../models/SchoolClass");
const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const base = require("./smisTimetableController");

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const slotKey = (day, period) => `${day}:${period}`;
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
const populate = (query) => query.populate("schoolClass", "name stream academicYear").populate("subject", "name code").populate("teacher", "firstName lastName name email");

async function resolveTeacher(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (validId(raw)) {
    const teacher = await User.findOne({ _id: raw, role: "teacher", isActive: true }).lean();
    if (teacher) return teacher;
  }
  const profile = await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean();
  if (profile) return User.findOne({ _id: profile.teacher, role: "teacher", isActive: true }).lean();
  return User.findOne({ role: "teacher", isActive: true, $or: [{ name: new RegExp(`^${escapeRegex(raw)}$`, "i") }, { email: raw.toLowerCase() }] }).lean();
}

function schedule(tasks, slots) {
  const classBusy = new Set();
  const teacherBusy = new Set();
  const result = [];
  const classDaySubject = new Map();
  const classDayLoad = new Map();
  const teacherDayLoad = new Map();
  let nodes = 0;
  const limit = Math.max(100000, tasks.length * slots.length * 250);

  const candidates = (task) => {
    const output = [];
    for (const slot of slots) {
      const key = slotKey(slot.dayOfWeek, slot.period);
      if (classBusy.has(`${task.schoolClass}:${key}`)) continue;
      for (const teacher of task.teacherOptions) {
        if (!teacherBusy.has(`${teacher}:${key}`)) output.push({ slot, teacher });
      }
    }
    return output;
  };

  const search = (remaining) => {
    if (!remaining.length) return true;
    if (++nodes > limit) return false;
    let chosen = -1;
    let options = null;
    for (let i = 0; i < remaining.length; i += 1) {
      const next = candidates(remaining[i]);
      if (!next.length) return false;
      if (!options || next.length < options.length) {
        chosen = i;
        options = next;
        if (next.length === 1) break;
      }
    }

    const task = remaining[chosen];
    options.sort((a, b) => {
      const sa = classDaySubject.get(`${task.schoolClass}:${a.slot.dayOfWeek}:${task.subject}`) || 0;
      const sb = classDaySubject.get(`${task.schoolClass}:${b.slot.dayOfWeek}:${task.subject}`) || 0;
      const ca = classDayLoad.get(`${task.schoolClass}:${a.slot.dayOfWeek}`) || 0;
      const cb = classDayLoad.get(`${task.schoolClass}:${b.slot.dayOfWeek}`) || 0;
      const ta = teacherDayLoad.get(`${a.teacher}:${a.slot.dayOfWeek}`) || 0;
      const tb = teacherDayLoad.get(`${b.teacher}:${b.slot.dayOfWeek}`) || 0;
      return (sa * 100 + ta * 10 + ca) - (sb * 100 + tb * 10 + cb);
    });

    for (const candidate of options) {
      const { slot, teacher } = candidate;
      const key = slotKey(slot.dayOfWeek, slot.period);
      const classKey = `${task.schoolClass}:${key}`;
      const teacherKey = `${teacher}:${key}`;
      const subjectKey = `${task.schoolClass}:${slot.dayOfWeek}:${task.subject}`;
      const classDayKey = `${task.schoolClass}:${slot.dayOfWeek}`;
      const teacherDayKey = `${teacher}:${slot.dayOfWeek}`;
      classBusy.add(classKey);
      teacherBusy.add(teacherKey);
      result.push({ ...task, ...slot, teacher });
      classDaySubject.set(subjectKey, (classDaySubject.get(subjectKey) || 0) + 1);
      classDayLoad.set(classDayKey, (classDayLoad.get(classDayKey) || 0) + 1);
      teacherDayLoad.set(teacherDayKey, (teacherDayLoad.get(teacherDayKey) || 0) + 1);
      if (search(remaining.slice(0, chosen).concat(remaining.slice(chosen + 1)))) return true;
      result.pop();
      classBusy.delete(classKey);
      teacherBusy.delete(teacherKey);
      const subjectCount = (classDaySubject.get(subjectKey) || 1) - 1;
      const classCount = (classDayLoad.get(classDayKey) || 1) - 1;
      const teacherCount = (teacherDayLoad.get(teacherDayKey) || 1) - 1;
      subjectCount ? classDaySubject.set(subjectKey, subjectCount) : classDaySubject.delete(subjectKey);
      classCount ? classDayLoad.set(classDayKey, classCount) : classDayLoad.delete(classDayKey);
      teacherCount ? teacherDayLoad.set(teacherDayKey, teacherCount) : teacherDayLoad.delete(teacherDayKey);
    }
    return false;
  };

  return search([...tasks].sort((a, b) => b.constraints - a.constraints)) ? result : null;
}

async function getTimetableConfig(req, res) {
  try {
    const { academicYear, term } = req.query;
    if (!academicYear || !term) return res.status(400).json({ success: false, message: "Academic year and term are required." });
    const config = await SchoolTimetableConfig.findOne({ academicYear, term }).lean();
    return res.json({ success: true, config: config || null });
  } catch (error) {
    console.error("Get timetable config error:", error);
    return res.status(500).json({ success: false, message: "Unable to load timetable configuration." });
  }
}

async function saveTimetableConfig(req, res) {
  try {
    const { academicYear, term, periods, classPlans } = req.body || {};
    if (!academicYear || !term || !Array.isArray(periods) || !periods.length || !Array.isArray(classPlans)) return res.status(400).json({ success: false, message: "Academic year, term, periods and class plans are required." });
    await assertUnlocked(academicYear, term);
    const cleanPeriods = periods.map((period, index) => ({ period: index + 1, startTime: String(period.startTime || "").trim(), endTime: String(period.endTime || "").trim() }));
    if (cleanPeriods.some((period) => !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(period.startTime) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(period.endTime) || period.startTime >= period.endTime)) return res.status(400).json({ success: false, message: "Every school period must have valid start and end times." });
    const cleanPlans = classPlans.map((plan) => ({ schoolClass: plan.schoolClass, lessons: (Array.isArray(plan.lessons) ? plan.lessons : []).map((lesson) => ({ subject: lesson.subject, teacher: String(lesson.teacher || ""), lessonsPerWeek: Number(lesson.lessonsPerWeek) })) }));
    const config = await SchoolTimetableConfig.findOneAndUpdate({ academicYear, term }, { $set: { periods: cleanPeriods, classPlans: cleanPlans, updatedBy: req.schoolUser?._id || null } }, { upsert: true, new: true, runValidators: true });
    return res.json({ success: true, config });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to save timetable configuration." });
  }
}

async function generateTimetable(req, res) {
  try {
    const { academicYear, term, classes, slots, replaceExisting = false } = req.body || {};
    if (!academicYear || !term || !Array.isArray(classes) || !Array.isArray(slots) || !slots.length) return res.status(400).json({ success: false, message: "Academic year, term, every class plan and school periods are required." });
    await assertUnlocked(academicYear, term);
    const existingCount = await Timetable.countDocuments({ academicYear, term, isActive: true });
    if (existingCount && !replaceExisting) return res.status(409).json({ success: false, code: "TIMETABLE_EXISTS", message: `A timetable already exists for ${academicYear}, ${term}. Confirm replacement before generating again.` });

    const cleanSlots = slots.map((slot) => ({ dayOfWeek: Number(slot.dayOfWeek), period: Number(slot.period), startTime: String(slot.startTime || "").trim(), endTime: String(slot.endTime || "").trim() }));
    if (cleanSlots.some((slot) => slot.dayOfWeek < 1 || slot.dayOfWeek > 5 || !Number.isInteger(slot.period) || slot.period < 1 || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(slot.startTime) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(slot.endTime) || slot.startTime >= slot.endTime)) return res.status(400).json({ success: false, message: "Every period must have valid Monday–Friday day and start/end times." });
    if (new Set(cleanSlots.map((slot) => slotKey(slot.dayOfWeek, slot.period))).size !== cleanSlots.length) return res.status(400).json({ success: false, message: "Duplicate day/period slots are not allowed." });

    const activeClasses = await SchoolClass.find({ isActive: true, academicYear }).lean();
    const activeIds = new Set(activeClasses.map((item) => String(item._id)));
    const submittedIds = classes.map((item) => String(item.schoolClass));
    if (submittedIds.length !== activeClasses.length || new Set(submittedIds).size !== submittedIds.length || submittedIds.some((id) => !validId(id) || !activeIds.has(id))) return res.status(400).json({ success: false, message: "The timetable must contain exactly one complete plan for every active class in the selected academic year." });

    const allocations = await ClassSubjectAllocation.find({ academicYear, isActive: true, schoolClass: { $in: [...activeIds] } }).lean();
    const allocationMap = new Map(allocations.map((item) => [`${item.schoolClass}:${item.subject}`, item]));
    const subjectIds = [];
    const problems = [];
    const tasks = [];
    const teacherMandatoryLoad = new Map();

    for (const plan of classes) {
      if (!Array.isArray(plan.lessons) || !plan.lessons.length) { problems.push(`Class ${plan.schoolClass} has no lessons.`); continue; }
      const seenSubjects = new Set();
      const total = plan.lessons.reduce((sum, lesson) => sum + Number(lesson.lessonsPerWeek || 0), 0);
      if (total > cleanSlots.length) problems.push(`Class ${plan.schoolClass} requires ${total} lessons but only ${cleanSlots.length} weekly slots exist.`);
      for (const lesson of plan.lessons) {
        const subjectId = String(lesson.subject || "");
        const count = Number(lesson.lessonsPerWeek);
        if (seenSubjects.has(subjectId)) { problems.push(`Class ${plan.schoolClass} lists the same subject more than once.`); continue; }
        seenSubjects.add(subjectId);
        if (!validId(subjectId) || !Number.isInteger(count) || count < 1) { problems.push(`Class ${plan.schoolClass} has an invalid lesson allocation.`); continue; }
        const allocation = allocationMap.get(`${plan.schoolClass}:${subjectId}`);
        if (!allocation || !allocation.teachers?.length) { problems.push(`Class ${plan.schoolClass} has no teacher allocation for subject ${subjectId}.`); continue; }
        const options = [...new Set(allocation.teachers.map(String))];
        const explicitTeacher = String(lesson.teacher || "").trim();
        if (explicitTeacher && (!validId(explicitTeacher) || !options.includes(explicitTeacher))) { problems.push(`Teacher ${explicitTeacher} is not allocated to this subject for class ${plan.schoolClass}.`); continue; }
        const teacherOptions = explicitTeacher ? [explicitTeacher] : options;
        if (teacherOptions.length === 1) teacherMandatoryLoad.set(teacherOptions[0], (teacherMandatoryLoad.get(teacherOptions[0]) || 0) + count);
        const subject = await Subject.findOne({ _id: subjectId, isActive: true }).select("_id name code").lean();
        if (!subject) { problems.push(`Subject ${subjectId} was not found or is inactive.`); continue; }
        subjectIds.push(subjectId);
        for (let i = 0; i < count; i += 1) tasks.push({ schoolClass: String(plan.schoolClass), subject: String(subject._id), teacherOptions, constraints: count });
      }
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });

    for (const [teacherId, count] of teacherMandatoryLoad.entries()) if (count > cleanSlots.length) {
      const teacher = await resolveTeacher(teacherId);
      problems.push(`${teacher?.name || teacher?.email || "A teacher"} has ${count} mandatory lessons but only ${cleanSlots.length} weekly slots are available.`);
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });

    const assignments = schedule(tasks, cleanSlots);
    if (!assignments) return res.status(409).json({ success: false, message: "No collision-free timetable exists for the supplied class plans. Check teacher workloads, class workloads, allocations and available school periods." });
    const rows = assignments.map((item) => ({ schoolClass: item.schoolClass, subject: item.subject, teacher: item.teacher, dayOfWeek: item.dayOfWeek, period: item.period, startTime: item.startTime, endTime: item.endTime, academicYear, term, isActive: true }));

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      if (existingCount) await Timetable.deleteMany({ academicYear, term }, { session });
      await Timetable.insertMany(rows, { session, ordered: true });
      await SchoolTimetableConfig.findOneAndUpdate({ academicYear, term }, { $set: { periods: [...new Map(cleanSlots.map((slot) => [slot.period, { period: slot.period, startTime: slot.startTime, endTime: slot.endTime }])).values()], classPlans: classes, generatedAt: new Date(), generatedCount: rows.length, updatedBy: req.schoolUser?._id || null, locked: false, lockedAt: null, lockedBy: null } }, { upsert: true, new: true, runValidators: true, session });
      await session.commitTransaction();
    } catch (error) { await session.abortTransaction(); throw error; } finally { await session.endSession(); }

    const created = await populate(Timetable.find({ academicYear, term, isActive: true }).sort({ dayOfWeek: 1, period: 1, schoolClass: 1 })).lean();
    return res.status(201).json({ success: true, count: rows.length, data: created, message: `Generated ${rows.length} lessons for all ${activeClasses.length} active classes with no class or teacher collisions.` });
  } catch (error) {
    console.error("Generate timetable error:", error);
    return res.status(error?.code === 11000 ? 409 : error.status || 500).json({ success: false, message: error?.code === 11000 ? "The generated timetable contains a duplicate class or teacher period." : error.message || "Unable to generate timetable." });
  }
}

async function lockTimetable(req, res) {
  const { academicYear, term } = req.body || {};
  if (!academicYear || !term) return res.status(400).json({ success: false, message: "Academic year and term are required." });
  const count = await Timetable.countDocuments({ academicYear, term, isActive: true });
  if (!count) return res.status(400).json({ success: false, message: "Generate a timetable before locking it." });
  const config = await SchoolTimetableConfig.findOneAndUpdate({ academicYear, term }, { $set: { locked: true, lockedAt: new Date(), lockedBy: req.schoolUser?._id || null } }, { new: true });
  return res.json({ success: true, config });
}

async function unlockTimetable(req, res) {
  const { academicYear, term } = req.body || {};
  if (!academicYear || !term) return res.status(400).json({ success: false, message: "Academic year and term are required." });
  const config = await SchoolTimetableConfig.findOneAndUpdate({ academicYear, term }, { $set: { locked: false }, $unset: { lockedAt: 1, lockedBy: 1 } }, { new: true });
  if (!config) return res.status(404).json({ success: false, message: "Timetable configuration not found." });
  return res.json({ success: true, config });
}

async function assertUnlocked(academicYear, term) {
  const config = await SchoolTimetableConfig.findOne({ academicYear, term });
  if (config?.locked) { const error = new Error("This timetable is locked. Unlock it before making changes."); error.status = 423; throw error; }
}

async function createTimetable(req, res) { try { await assertUnlocked(req.body?.academicYear, req.body?.term); return base.createTimetable(req, res); } catch (error) { return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to create timetable entry" }); } }
async function updateTimetable(req, res) { try { const current = await Timetable.findById(req.params.id).select("academicYear term").lean(); if (!current) return res.status(404).json({ success: false, message: "Timetable entry not found" }); await assertUnlocked(current.academicYear, current.term); return base.updateTimetable(req, res); } catch (error) { return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to update timetable entry" }); } }
async function deleteTimetable(req, res) { try { const current = await Timetable.findById(req.params.id).select("academicYear term").lean(); if (!current) return res.status(404).json({ success: false, message: "Timetable entry not found" }); await assertUnlocked(current.academicYear, current.term); return base.deleteTimetable(req, res); } catch (error) { return res.status(error.status || 500).json({ success: false, message: error.message || "Unable to delete timetable entry" }); } }

module.exports = { getTimetableConfig, saveTimetableConfig, generateTimetable, lockTimetable, unlockTimetable, createTimetable, updateTimetable, deleteTimetable };
