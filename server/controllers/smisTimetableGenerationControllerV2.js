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
const populate = (query) => query.populate("schoolClass", "name stream academicYear").populate("subject", "name code").populate("teacher", "firstName lastName name email");

async function resolveTeacher(value) {
  const raw = String(value || "").trim(); if (!raw) return null;
  if (validId(raw)) { const byId = await User.findOne({ _id: raw, role: "teacher", isActive: true }).lean(); if (byId) return byId; }
  const profile = await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean();
  if (profile) return User.findOne({ _id: profile.teacher, role: "teacher", isActive: true }).lean();
  return User.findOne({ role: "teacher", isActive: true, $or: [{ name: new RegExp(`^${escapeRegex(raw)}$`, "i") }, { email: raw.toLowerCase() }] }).lean();
}

function schedule(tasks, slots) {
  const classBusy = new Set(); const teacherBusy = new Set(); const result = [];
  const classDaySubject = new Map(); const classDayLoad = new Map(); const teacherDayLoad = new Map();
  let nodes = 0; const limit = Math.max(75000, tasks.length * slots.length * 150);
  const candidates = (task) => slots.filter((slot) => { const key = slotKey(slot.dayOfWeek, slot.period); return !classBusy.has(`${task.schoolClass}:${key}`) && !teacherBusy.has(`${task.teacher}:${key}`); });
  const search = (remaining) => {
    if (!remaining.length) return true; if (++nodes > limit) return false;
    let chosen = -1; let options = null;
    for (let i = 0; i < remaining.length; i += 1) { const next = candidates(remaining[i]); if (!next.length) return false; if (!options || next.length < options.length) { chosen = i; options = next; if (next.length === 1) break; } }
    const task = remaining[chosen];
    options.sort((a, b) => {
      const sa = classDaySubject.get(`${task.schoolClass}:${a.dayOfWeek}:${task.subject}`) || 0; const sb = classDaySubject.get(`${task.schoolClass}:${b.dayOfWeek}:${task.subject}`) || 0;
      const ca = classDayLoad.get(`${task.schoolClass}:${a.dayOfWeek}`) || 0; const cb = classDayLoad.get(`${task.schoolClass}:${b.dayOfWeek}`) || 0;
      const ta = teacherDayLoad.get(`${task.teacher}:${a.dayOfWeek}`) || 0; const tb = teacherDayLoad.get(`${task.teacher}:${b.dayOfWeek}`) || 0;
      return (sa * 100 + ta * 10 + ca) - (sb * 100 + tb * 10 + cb);
    });
    for (const slot of options) {
      const key = slotKey(slot.dayOfWeek, slot.period); const ck = `${task.schoolClass}:${key}`; const tk = `${task.teacher}:${key}`; const sk = `${task.schoolClass}:${slot.dayOfWeek}:${task.subject}`; const cd = `${task.schoolClass}:${slot.dayOfWeek}`; const td = `${task.teacher}:${slot.dayOfWeek}`;
      classBusy.add(ck); teacherBusy.add(tk); result.push({ ...task, ...slot }); classDaySubject.set(sk, (classDaySubject.get(sk) || 0) + 1); classDayLoad.set(cd, (classDayLoad.get(cd) || 0) + 1); teacherDayLoad.set(td, (teacherDayLoad.get(td) || 0) + 1);
      if (search(remaining.slice(0, chosen).concat(remaining.slice(chosen + 1)))) return true;
      result.pop(); classBusy.delete(ck); teacherBusy.delete(tk);
      const s = (classDaySubject.get(sk) || 1) - 1; s ? classDaySubject.set(sk, s) : classDaySubject.delete(sk); const c = (classDayLoad.get(cd) || 1) - 1; c ? classDayLoad.set(cd, c) : classDayLoad.delete(cd); const t = (teacherDayLoad.get(td) || 1) - 1; t ? teacherDayLoad.set(td, t) : teacherDayLoad.delete(td);
    }
    return false;
  };
  return search([...tasks].sort((a, b) => b.constraints - a.constraints)) ? result : null;
}

async function getTimetableConfig(req, res) {
  try { const { academicYear, term } = req.query; if (!academicYear || !term) return res.status(400).json({ success: false, message: "Academic year and term are required." }); const config = await SchoolTimetableConfig.findOne({ academicYear, term }).lean(); return res.json({ success: true, config: config || null }); }
  catch (error) { console.error("Get timetable config error:", error); return res.status(500).json({ success: false, message: "Unable to load timetable configuration." }); }
}

async function generateTimetable(req, res) {
  try {
    const { academicYear, term, classes, slots } = req.body || {};
    if (!academicYear || !term || !Array.isArray(classes) || !classes.length || !Array.isArray(slots) || !slots.length) return res.status(400).json({ success: false, message: "Academic year, term, every class plan and school periods are required." });
    const cleanSlots = slots.map((slot) => ({ dayOfWeek: Number(slot.dayOfWeek), period: Number(slot.period), startTime: String(slot.startTime || "").trim(), endTime: String(slot.endTime || "").trim() }));
    if (cleanSlots.some((s) => s.dayOfWeek < 1 || s.dayOfWeek > 5 || !Number.isInteger(s.period) || s.period < 1 || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(s.startTime) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(s.endTime) || s.startTime >= s.endTime)) return res.status(400).json({ success: false, message: "Every period must have valid Monday–Friday day and start/end times." });
    if (new Set(cleanSlots.map((s) => slotKey(s.dayOfWeek, s.period))).size !== cleanSlots.length) return res.status(400).json({ success: false, message: "Duplicate day/period slots are not allowed." });

    const activeClasses = await SchoolClass.find({ isActive: true, academicYear }).lean(); const activeIds = new Set(activeClasses.map((c) => String(c._id))); const submittedIds = classes.map((c) => String(c.schoolClass));
    if (submittedIds.length !== activeClasses.length || new Set(submittedIds).size !== submittedIds.length || submittedIds.some((id) => !validId(id) || !activeIds.has(id))) return res.status(400).json({ success: false, message: "The timetable must contain exactly one plan for every active class in the selected academic year." });

    const subjectIds = []; const raw = []; const problems = []; const teacherCache = new Map(); const teacherLoad = new Map();
    for (const plan of classes) {
      if (!Array.isArray(plan.lessons) || !plan.lessons.length) { problems.push(`Class ${plan.schoolClass} has no lessons.`); continue; }
      const total = plan.lessons.reduce((sum, l) => sum + Number(l.lessonsPerWeek || 0), 0); if (total > cleanSlots.length) problems.push(`Class ${plan.schoolClass} needs ${total} lessons but only ${cleanSlots.length} weekly slots exist.`);
      for (const lesson of plan.lessons) { const count = Number(lesson.lessonsPerWeek); const teacher = String(lesson.teacher || "").trim(); if (!validId(lesson.subject) || !Number.isInteger(count) || count < 1 || !teacher) { problems.push(`Class ${plan.schoolClass} has an invalid lesson entry.`); continue; } raw.push({ schoolClass: plan.schoolClass, subject: lesson.subject, teacherValue: teacher, lessonsPerWeek: count }); subjectIds.push(lesson.subject); }
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });

    const subjects = await Subject.find({ _id: { $in: [...new Set(subjectIds.map(String))] }, isActive: true }).lean(); const subjectMap = new Map(subjects.map((s) => [String(s._id), s])); const tasks = [];
    for (const lesson of raw) {
      const subject = subjectMap.get(String(lesson.subject)); if (!subject) { problems.push(`Subject ${lesson.subject} was not found or is inactive.`); continue; }
      const teacherKey = lesson.teacherValue.toLowerCase(); if (!teacherCache.has(teacherKey)) teacherCache.set(teacherKey, await resolveTeacher(lesson.teacherValue)); const teacher = teacherCache.get(teacherKey);
      if (!teacher) { problems.push(`Teacher '${lesson.teacherValue}' was not found.`); continue; }
      if (!subject.teachers?.some((id) => String(id) === String(teacher._id))) { problems.push(`${teacher.name || teacher.email} is not allocated to ${subject.name}.`); continue; }
      const load = (teacherLoad.get(String(teacher._id)) || 0) + lesson.lessonsPerWeek; teacherLoad.set(String(teacher._id), load); if (load > cleanSlots.length) problems.push(`${teacher.name || teacher.email} is assigned ${load} lessons but only ${cleanSlots.length} periods are available per week.`);
      for (let i = 0; i < lesson.lessonsPerWeek; i += 1) tasks.push({ schoolClass: String(lesson.schoolClass), subject: String(subject._id), teacher: String(teacher._id), constraints: lesson.lessonsPerWeek });
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });
    const assignments = schedule(tasks, cleanSlots); if (!assignments) return res.status(409).json({ success: false, message: "No collision-free timetable could be found. Add more periods, reduce weekly lessons, or allocate additional teachers." });
    const rows = assignments.map((a) => ({ schoolClass: a.schoolClass, subject: a.subject, teacher: a.teacher, dayOfWeek: a.dayOfWeek, period: a.period, startTime: a.startTime, endTime: a.endTime, academicYear, term, isActive: true }));

    const session = await mongoose.startSession();
    try { session.startTransaction(); await Timetable.deleteMany({ academicYear, term }, { session }); await Timetable.insertMany(rows, { session, ordered: true }); await SchoolTimetableConfig.findOneAndUpdate({ academicYear, term }, { $set: { periods: [...new Map(cleanSlots.map((s) => [s.period, { period: s.period, startTime: s.startTime, endTime: s.endTime }])).values()], classPlans: classes, generatedAt: new Date(), generatedCount: rows.length, updatedBy: req.schoolUser?._id || null } }, { upsert: true, new: true, runValidators: true, session }); await session.commitTransaction(); } catch (error) { await session.abortTransaction(); throw error; } finally { await session.endSession(); }
    const created = await populate(Timetable.find({ academicYear, term, isActive: true }).sort({ dayOfWeek: 1, period: 1, schoolClass: 1 })).lean();
    return res.status(201).json({ success: true, count: rows.length, data: created, message: `Generated ${rows.length} lessons for all ${activeClasses.length} active classes with no class or teacher collisions.` });
  } catch (error) { console.error("Generate timetable error:", error); return res.status(error?.code === 11000 ? 409 : 500).json({ success: false, message: error?.code === 11000 ? "The generated timetable contains a duplicate class or teacher period." : "Unable to generate timetable." }); }
}

module.exports = { ...base, getTimetableConfig, generateTimetable };
