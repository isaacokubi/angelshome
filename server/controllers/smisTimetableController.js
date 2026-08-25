const Timetable = require("../models/Timetable");
const SchoolTimetableConfig = require("../models/SchoolTimetableConfig");
const Subject = require("../models/Subject");
const SchoolClass = require("../models/SchoolClass");
const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const mongoose = require("mongoose");

const populate = (query) => query
  .populate("schoolClass", "name stream academicYear")
  .populate("subject", "name code")
  .populate("teacher", "firstName lastName name email");

const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const slotKey = (day, period) => `${day}:${period}`;
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");

const listTimetable = async (req, res) => {
  try {
    const filter = { isActive: true };
    for (const key of ["schoolClass", "stream", "teacher", "dayOfWeek", "academicYear", "term"]) {
      if (req.query[key] !== undefined && req.query[key] !== "") filter[key] = req.query[key];
    }
    const rows = await populate(Timetable.find(filter).sort({ dayOfWeek: 1, period: 1, schoolClass: 1 })).lean();
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("List timetable error:", error);
    return res.status(500).json({ success: false, message: "Failed to load timetable" });
  }
};

const getTimetableConfig = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    if (!academicYear || !term) return res.status(400).json({ success: false, message: "Academic year and term are required." });
    const config = await SchoolTimetableConfig.findOne({ academicYear, term }).lean();
    return res.json({ success: true, config: config || null });
  } catch (error) {
    console.error("Get timetable config error:", error);
    return res.status(500).json({ success: false, message: "Unable to load timetable configuration." });
  }
};

const createTimetable = async (req, res) => {
  try {
    const row = await Timetable.create(req.body);
    const populated = await populate(Timetable.findById(row._id)).lean();
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? "Timetable conflict: this class or teacher already has this period." : "Unable to create timetable entry" });
  }
};

const updateTimetable = async (req, res) => {
  try {
    const row = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: "Timetable entry not found" });
    return res.json({ success: true, data: await populate(Timetable.findById(row._id)).lean() });
  } catch (error) {
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? "Timetable conflict: this class or teacher already has this period." : "Unable to update timetable entry" });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const row = await Timetable.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: "Timetable entry not found" });
    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to remove timetable entry" });
  }
};

async function resolveTeacher(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (validId(raw)) {
    const teacher = await User.findOne({ _id: raw, role: "teacher", isActive: true }).lean();
    if (teacher) return teacher;
  }
  const profile = await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean();
  if (profile) return User.findOne({ _id: profile.teacher, role: "teacher", isActive: true }).lean();
  return User.findOne({ role: "teacher", isActive: true, $or: [
    { name: new RegExp(`^${escapeRegex(raw)}$`, "i") },
    { email: raw.toLowerCase() },
  ] }).lean();
}

function candidateSlots(task, slots, classBusy, teacherBusy) {
  return slots.filter((slot) => {
    const key = slotKey(slot.dayOfWeek, slot.period);
    return !classBusy.has(`${task.schoolClass}:${key}`) && !teacherBusy.has(`${task.teacher}:${key}`);
  });
}

function scheduleTasks(tasks, slots) {
  const classBusy = new Set();
  const teacherBusy = new Set();
  const classDaySubject = new Map();
  const classDayLoad = new Map();
  const teacherDayLoad = new Map();
  const result = [];
  const maxNodes = Math.max(50000, tasks.length * slots.length * 100);
  let nodes = 0;

  const chooseNext = (remaining) => {
    let bestIndex = -1;
    let bestCandidates = null;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidates = candidateSlots(remaining[i], slots, classBusy, teacherBusy);
      if (!candidates.length) return { index: i, candidates: [] };
      if (!bestCandidates || candidates.length < bestCandidates.length) {
        bestIndex = i;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }
    return { index: bestIndex, candidates: bestCandidates || [] };
  };

  const search = (remaining) => {
    if (!remaining.length) return true;
    if (++nodes > maxNodes) return false;
    const { index, candidates } = chooseNext(remaining);
    if (!candidates.length) return false;
    const task = remaining[index];
    const ordered = [...candidates].sort((a, b) => {
      const aSubject = classDaySubject.get(`${task.schoolClass}:${a.dayOfWeek}:${task.subject}`) || 0;
      const bSubject = classDaySubject.get(`${task.schoolClass}:${b.dayOfWeek}:${task.subject}`) || 0;
      const aClass = classDayLoad.get(`${task.schoolClass}:${a.dayOfWeek}`) || 0;
      const bClass = classDayLoad.get(`${task.schoolClass}:${b.dayOfWeek}`) || 0;
      const aTeacher = teacherDayLoad.get(`${task.teacher}:${a.dayOfWeek}`) || 0;
      const bTeacher = teacherDayLoad.get(`${task.teacher}:${b.dayOfWeek}`) || 0;
      return (aSubject * 100 + aTeacher * 10 + aClass) - (bSubject * 100 + bTeacher * 10 + bClass);
    });

    for (const slot of ordered) {
      const key = slotKey(slot.dayOfWeek, slot.period);
      const classKey = `${task.schoolClass}:${key}`;
      const teacherKey = `${task.teacher}:${key}`;
      const subjectKey = `${task.schoolClass}:${slot.dayOfWeek}:${task.subject}`;
      const classDayKey = `${task.schoolClass}:${slot.dayOfWeek}`;
      const teacherDayKey = `${task.teacher}:${slot.dayOfWeek}`;
      classBusy.add(classKey); teacherBusy.add(teacherKey);
      classDaySubject.set(subjectKey, (classDaySubject.get(subjectKey) || 0) + 1);
      classDayLoad.set(classDayKey, (classDayLoad.get(classDayKey) || 0) + 1);
      teacherDayLoad.set(teacherDayKey, (teacherDayLoad.get(teacherDayKey) || 0) + 1);
      result.push({ ...task, ...slot });
      const next = remaining.slice(0, index).concat(remaining.slice(index + 1));
      if (search(next)) return true;
      result.pop();
      classBusy.delete(classKey); teacherBusy.delete(teacherKey);
      const subjectCount = classDaySubject.get(subjectKey) - 1; if (subjectCount) classDaySubject.set(subjectKey, subjectCount); else classDaySubject.delete(subjectKey);
      const classCount = classDayLoad.get(classDayKey) - 1; if (classCount) classDayLoad.set(classDayKey, classCount); else classDayLoad.delete(classDayKey);
      const teacherCount = teacherDayLoad.get(teacherDayKey) - 1; if (teacherCount) teacherDayLoad.set(teacherDayKey, teacherCount); else teacherDayLoad.delete(teacherDayKey);
    }
    return false;
  };

  return search(tasks) ? result : null;
}

const generateTimetable = async (req, res) => {
  try {
    const { academicYear, term, classes, slots } = req.body || {};
    if (!academicYear || !term || !Array.isArray(classes) || !classes.length || !Array.isArray(slots) || !slots.length) {
      return res.status(400).json({ success: false, message: "Academic year, term, classes and timetable periods are required." });
    }

    const cleanSlots = slots.map((slot) => ({
      dayOfWeek: Number(slot.dayOfWeek), period: Number(slot.period), startTime: String(slot.startTime || "").trim(), endTime: String(slot.endTime || "").trim(),
    }));
    const invalidPeriod = cleanSlots.find((slot) => slot.dayOfWeek < 1 || slot.dayOfWeek > 5 || !Number.isInteger(slot.period) || slot.period < 1 || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(slot.startTime) || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(slot.endTime) || slot.startTime >= slot.endTime);
    if (invalidPeriod) return res.status(400).json({ success: false, message: "Every school period must have a valid Monday–Friday day, period number, start time and end time." });
    const uniqueSlotKeys = new Set(cleanSlots.map((slot) => slotKey(slot.dayOfWeek, slot.period)));
    if (uniqueSlotKeys.size !== cleanSlots.length) return res.status(400).json({ success: false, message: "Each day and period combination must be unique." });

    const classIds = classes.map((item) => item.schoolClass);
    if (classIds.some((value) => !validId(value)) || new Set(classIds.map(String)).size !== classIds.length) {
      return res.status(400).json({ success: false, message: "Every active class must appear exactly once and have a valid class id." });
    }
    const classDocs = await SchoolClass.find({ _id: { $in: classIds }, isActive: true }).lean();
    if (classDocs.length !== classIds.length) return res.status(400).json({ success: false, message: "One or more selected classes are inactive or do not exist." });

    const subjectIds = [];
    const rawLessons = [];
    for (const classPlan of classes) {
      if (!Array.isArray(classPlan.lessons) || !classPlan.lessons.length) return res.status(400).json({ success: false, message: `Class ${classPlan.schoolClass} has no lessons in its plan.` });
      for (const lesson of classPlan.lessons) {
        const count = Number(lesson.lessonsPerWeek);
        if (!validId(lesson.subject) || !Number.isInteger(count) || count < 1) return res.status(400).json({ success: false, message: "Every lesson must have a valid subject and a positive integer lessons-per-week value." });
        rawLessons.push({ schoolClass: classPlan.schoolClass, subject: lesson.subject, teacherValue: String(lesson.teacher || "").trim(), lessonsPerWeek: count });
        subjectIds.push(lesson.subject);
      }
      const total = classPlan.lessons.reduce((sum, lesson) => sum + Number(lesson.lessonsPerWeek || 0), 0);
      if (total > cleanSlots.length) return res.status(409).json({ success: false, message: `Class ${classPlan.schoolClass} requires ${total} lessons but only ${cleanSlots.length} weekly slots are available.` });
    }

    const subjects = await Subject.find({ _id: { $in: [...new Set(subjectIds.map(String))] }, isActive: true }).lean();
    const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));
    const teacherCache = new Map();
    const tasks = [];
    const problems = [];
    const teacherWeeklyLoad = new Map();

    for (const lesson of rawLessons) {
      const subject = subjectMap.get(String(lesson.subject));
      if (!subject) { problems.push(`Subject ${lesson.subject} was not found or is inactive.`); continue; }
      const teacherKey = lesson.teacherValue.toLowerCase();
      if (!teacherCache.has(teacherKey)) teacherCache.set(teacherKey, await resolveTeacher(lesson.teacherValue));
      const teacher = teacherCache.get(teacherKey);
      if (!teacher) { problems.push(`Teacher '${lesson.teacherValue}' was not found. Use a teacher code, exact name, email or user id.`); continue; }
      if (!subject.teachers?.some((teacherId) => String(teacherId) === String(teacher._id))) {
        problems.push(`${teacher.name || teacher.email} is not allocated to ${subject.name}. Allocate the teacher to the subject first.`);
        continue;
      }
      const currentLoad = (teacherWeeklyLoad.get(String(teacher._id)) || 0) + lesson.lessonsPerWeek;
      teacherWeeklyLoad.set(String(teacher._id), currentLoad);
      if (currentLoad > cleanSlots.length) problems.push(`${teacher.name || teacher.email} is assigned ${currentLoad} lessons but can teach at most ${cleanSlots.length} periods per week.`);
      for (let occurrence = 0; occurrence < lesson.lessonsPerWeek; occurrence += 1) {
        tasks.push({ schoolClass: String(lesson.schoolClass), subject: String(subject._id), teacher: String(teacher._id), subjectName: subject.name, teacherName: teacher.name || teacher.email });
      }
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(" ") });

    const assignments = scheduleTasks(tasks, cleanSlots);
    if (!assignments) return res.status(409).json({ success: false, message: "No collision-free timetable exists for the supplied lesson plan. Add more periods, reduce lesson counts, or distribute subjects across additional allocated teachers." });

    const rows = assignments.map((item) => ({ schoolClass: item.schoolClass, subject: item.subject, teacher: item.teacher, dayOfWeek: item.dayOfWeek, period: item.period, startTime: item.startTime, endTime: item.endTime, academicYear, term, isActive: true }));

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await Timetable.deleteMany({ schoolClass: { $in: classIds }, academicYear, term }, { session });
      await Timetable.insertMany(rows, { session, ordered: true });
      await SchoolTimetableConfig.findOneAndUpdate(
        { academicYear, term },
        { $set: { periods: cleanSlots.filter((slot, index, all) => all.findIndex((x) => x.period === slot.period) === index).map((slot) => ({ period: slot.period, startTime: slot.startTime, endTime: slot.endTime })), classPlans: classes, generatedAt: new Date(), generatedCount: rows.length, updatedBy: req.schoolUser?._id || null } },
        { upsert: true, new: true, runValidators: true, session },
      );
      await session.commitTransaction();
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      await session.endSession();
    }

    const created = await populate(Timetable.find({ academicYear, term, isActive: true }).sort({ dayOfWeek: 1, period: 1, schoolClass: 1 })).lean();
    return res.status(201).json({ success: true, count: rows.length, data: created, message: `Generated ${rows.length} timetable lessons for ${classIds.length} classes with no class or teacher collisions.` });
  } catch (error) {
    console.error("Generate timetable error:", error);
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? "The timetable contains a duplicate class or teacher period." : "Unable to generate timetable." });
  }
};

module.exports = { listTimetable, getTimetableConfig, createTimetable, updateTimetable, deleteTimetable, generateTimetable };
