const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const SchoolClass = require('../models/SchoolClass');
const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const mongoose = require('mongoose');

const populate = (query) => query
  .populate('schoolClass', 'name stream academicYear')
  .populate('subject', 'name code')
  .populate('teacher', 'firstName lastName name email');

const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const listTimetable = async (req, res) => {
  try {
    const filter = { isActive: true };
    for (const key of ['schoolClass', 'stream', 'teacher', 'dayOfWeek', 'academicYear', 'term']) {
      if (req.query[key] !== undefined && req.query[key] !== '') filter[key] = req.query[key];
    }
    const rows = await populate(Timetable.find(filter).sort({ dayOfWeek: 1, period: 1, schoolClass: 1 })).lean();
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load timetable' });
  }
};

const createTimetable = async (req, res) => {
  try {
    const row = await Timetable.create(req.body);
    const populated = await populate(Timetable.findById(row._id)).lean();
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 400).json({
      success: false,
      message: duplicate ? 'Timetable conflict: this class or teacher already has this period.' : 'Unable to create timetable entry',
    });
  }
};

const updateTimetable = async (req, res) => {
  try {
    const row = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    return res.json({ success: true, data: await populate(Timetable.findById(row._id)).lean() });
  } catch (error) {
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? 'Timetable conflict: this class or teacher already has this period.' : 'Unable to update timetable entry' });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const row = await Timetable.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to remove timetable entry' });
  }
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');

async function resolveTeacher(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (validId(raw)) {
    const teacher = await User.findOne({ _id: raw, role: 'teacher', isActive: true }).lean();
    if (teacher) return teacher;
  }
  const profile = await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean();
  if (profile) return User.findOne({ _id: profile.teacher, role: 'teacher', isActive: true }).lean();
  return User.findOne({ role: 'teacher', isActive: true, $or: [
    { name: new RegExp(`^${escapeRegex(raw)}$`, 'i') },
    { email: raw.toLowerCase() },
  ] }).lean();
}

function slotKey(dayOfWeek, period) { return `${dayOfWeek}:${period}`; }

function buildAttempt(tasks, slots) {
  const classBusy = new Set();
  const teacherBusy = new Set();
  const daySubjectCount = new Map();
  const teacherDayLoad = new Map();
  const assignments = [];

  const shuffledSlots = [...slots].sort(() => Math.random() - 0.5);
  for (const task of tasks) {
    const candidates = shuffledSlots.filter((slot) => {
      const slotKeyValue = slotKey(slot.dayOfWeek, slot.period);
      return !classBusy.has(`${task.schoolClass}:${slotKeyValue}`) && !teacherBusy.has(`${task.teacher}:${slotKeyValue}`);
    });
    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      const subjectA = daySubjectCount.get(`${task.schoolClass}:${a.dayOfWeek}:${task.subject}`) || 0;
      const subjectB = daySubjectCount.get(`${task.schoolClass}:${b.dayOfWeek}:${task.subject}`) || 0;
      const teacherA = teacherDayLoad.get(`${task.teacher}:${a.dayOfWeek}`) || 0;
      const teacherB = teacherDayLoad.get(`${task.teacher}:${b.dayOfWeek}`) || 0;
      const classA = daySubjectCount.get(`${task.schoolClass}:${a.dayOfWeek}:__TOTAL__`) || 0;
      const classB = daySubjectCount.get(`${task.schoolClass}:${b.dayOfWeek}:__TOTAL__`) || 0;
      return (subjectA * 100 + teacherA * 10 + classA) - (subjectB * 100 + teacherB * 10 + classB);
    });

    const slot = candidates[0];
    const key = slotKey(slot.dayOfWeek, slot.period);
    classBusy.add(`${task.schoolClass}:${key}`);
    teacherBusy.add(`${task.teacher}:${key}`);
    daySubjectCount.set(`${task.schoolClass}:${slot.dayOfWeek}:${task.subject}`, (daySubjectCount.get(`${task.schoolClass}:${slot.dayOfWeek}:${task.subject}`) || 0) + 1);
    daySubjectCount.set(`${task.schoolClass}:${slot.dayOfWeek}:__TOTAL__`, (daySubjectCount.get(`${task.schoolClass}:${slot.dayOfWeek}:__TOTAL__`) || 0) + 1);
    teacherDayLoad.set(`${task.teacher}:${slot.dayOfWeek}`, (teacherDayLoad.get(`${task.teacher}:${slot.dayOfWeek}`) || 0) + 1);
    assignments.push({ ...task, ...slot });
  }
  return assignments;
}

const generateTimetable = async (req, res) => {
  try {
    const { academicYear, term, classes, slots } = req.body || {};
    if (!academicYear || !term || !Array.isArray(classes) || !classes.length || !Array.isArray(slots) || !slots.length) {
      return res.status(400).json({ success: false, message: 'Academic year, term, classes and timetable periods are required.' });
    }
    const cleanSlots = slots.map((slot) => ({
      dayOfWeek: Number(slot.dayOfWeek),
      period: Number(slot.period),
      startTime: String(slot.startTime || '').trim(),
      endTime: String(slot.endTime || '').trim(),
    })).filter((slot) => slot.dayOfWeek >= 1 && slot.dayOfWeek <= 7 && slot.period >= 1 && slot.startTime && slot.endTime);
    const uniqueSlotKeys = new Set(cleanSlots.map((slot) => slotKey(slot.dayOfWeek, slot.period)));
    if (uniqueSlotKeys.size !== cleanSlots.length) return res.status(400).json({ success: false, message: 'Each day and period combination must be unique.' });

    const classIds = classes.map((item) => item.schoolClass).filter(validId);
    if (classIds.length !== classes.length) return res.status(400).json({ success: false, message: 'Every timetable class must have a valid class id.' });
    const classDocs = await SchoolClass.find({ _id: { $in: classIds }, isActive: true }).lean();
    if (classDocs.length !== classIds.length) return res.status(400).json({ success: false, message: 'One or more selected classes are not active or do not exist.' });

    const subjectIds = [];
    const teacherValues = [];
    const rawLessons = [];
    for (const classPlan of classes) {
      if (!Array.isArray(classPlan.lessons)) return res.status(400).json({ success: false, message: 'Each class must contain a lessons list.' });
      for (const lesson of classPlan.lessons) {
        const count = Number(lesson.lessonsPerWeek);
        if (!validId(lesson.subject) || !Number.isInteger(count) || count < 1 || count > cleanSlots.length) continue;
        subjectIds.push(lesson.subject); teacherValues.push(lesson.teacher);
        rawLessons.push({ schoolClass: classPlan.schoolClass, subject: lesson.subject, teacherValue: lesson.teacher, lessonsPerWeek: count });
      }
    }
    if (!rawLessons.length) return res.status(400).json({ success: false, message: 'Add at least one subject with a lessons-per-week value.' });

    const [subjects, teachers] = await Promise.all([
      Subject.find({ _id: { $in: [...new Set(subjectIds.map(String))] }, isActive: true }).lean(),
      Promise.all([...new Set(teacherValues.map((value) => String(value || '').trim()).filter(Boolean))].map(resolveTeacher)),
    ]);
    const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));
    const teacherMap = new Map(teachers.filter(Boolean).map((teacher) => [String(teacher._id), teacher]));
    const teacherValueMap = new Map();
    for (let index = 0; index < teacherValues.length; index += 1) {
      const raw = String(teacherValues[index] || '').trim();
      const teacher = teachers.find((item) => item && (String(item._id) === raw || item.name?.toLowerCase() === raw.toLowerCase() || item.email?.toLowerCase() === raw.toLowerCase()));
      if (teacher) teacherValueMap.set(raw.toLowerCase(), teacher);
      const profile = raw ? await TeacherProfile.findOne({ teacherCode: raw.toUpperCase() }).lean() : null;
      if (profile && teacherMap.has(String(profile.teacher))) teacherValueMap.set(raw.toLowerCase(), teacherMap.get(String(profile.teacher)));
    }

    const tasks = [];
    const problems = [];
    for (const lesson of rawLessons) {
      const subject = subjectMap.get(String(lesson.subject));
      const teacher = teacherValueMap.get(String(lesson.teacherValue || '').trim().toLowerCase());
      if (!subject) { problems.push(`Subject ${lesson.subject} was not found.`); continue; }
      if (!teacher) { problems.push(`Teacher '${lesson.teacherValue}' was not found. Use the teacher code, exact name, email or user id.`); continue; }
      if (!subject.teachers?.some((id) => String(id) === String(teacher._id))) {
        problems.push(`${teacher.name} is not allocated to ${subject.name}. Allocate the teacher to the subject first.`); continue;
      }
      for (let occurrence = 0; occurrence < lesson.lessonsPerWeek; occurrence += 1) tasks.push({ schoolClass: String(lesson.schoolClass), subject: String(subject._id), teacher: String(teacher._id), subjectName: subject.name, teacherName: teacher.name });
    }
    if (problems.length) return res.status(400).json({ success: false, message: problems.join(' ') });

    tasks.sort((a, b) => b.lessonsPerWeek - a.lessonsPerWeek);
    let assignments = null;
    for (let attempt = 0; attempt < 40 && !assignments; attempt += 1) {
      const ordered = [...tasks].sort(() => Math.random() - 0.5);
      assignments = buildAttempt(ordered, cleanSlots);
    }
    if (!assignments) return res.status(409).json({ success: false, message: 'A collision-free timetable could not be generated from the requested lessons. Reduce lessons per week, add more periods, or allocate another teacher.' });

    const rows = assignments.map((item) => ({
      schoolClass: item.schoolClass,
      subject: item.subject,
      teacher: item.teacher,
      dayOfWeek: item.dayOfWeek,
      period: item.period,
      startTime: item.startTime,
      endTime: item.endTime,
      academicYear,
      term,
      isActive: true,
    }));

    await Timetable.deleteMany({ schoolClass: { $in: classIds }, academicYear, term });
    await Timetable.insertMany(rows, { ordered: true });
    const created = await populate(Timetable.find({ schoolClass: { $in: classIds }, academicYear, term, isActive: true }).sort({ schoolClass: 1, dayOfWeek: 1, period: 1 })).lean();
    return res.status(201).json({ success: true, count: created.length, data: created, message: `Generated ${created.length} timetable lessons with no class or teacher period collisions.` });
  } catch (error) {
    console.error('Generate timetable error:', error);
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'The generated timetable contains a duplicate class or teacher period.' : 'Unable to generate timetable.' });
  }
};

module.exports = { listTimetable, createTimetable, updateTimetable, deleteTimetable, generateTimetable };
