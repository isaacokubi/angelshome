const Timetable = require('../models/Timetable');
const SchoolClass = require('../models/SchoolClass');
const PupilProfile = require('../models/PupilProfile');

const populate = (query) => query
  .populate('schoolClass', 'name stream academicYear')
  .populate('subject', 'name code')
  .populate('teacher', 'firstName lastName name email');

async function pupilClassIds(pupilIds) {
  const profiles = await PupilProfile.find({ pupil: { $in: pupilIds }, status: 'active', schoolClass: { $ne: null } })
    .select('schoolClass')
    .lean();
  return [...new Set(profiles.map((profile) => String(profile.schoolClass)).filter(Boolean))];
}

async function teacherClassIds(teacherId) {
  const [classTeacherClasses, taughtClasses] = await Promise.all([
    SchoolClass.find({ classTeacher: teacherId, isActive: true }).select('_id').lean(),
    Timetable.distinct('schoolClass', { teacher: teacherId, isActive: true }),
  ]);
  return [...new Set([
    ...classTeacherClasses.map((schoolClass) => String(schoolClass._id)),
    ...taughtClasses.map((schoolClass) => String(schoolClass)),
  ])];
}

async function allowedClassIdsForUser(user) {
  if (user.role === 'pupil') return pupilClassIds([user._id]);

  if (user.role === 'parent' || user.role === 'sponsor') {
    const pupilIds = user.role === 'parent' ? (user.children || []) : (user.sponsoredPupils || []);
    return pupilClassIds(pupilIds);
  }

  if (user.role === 'teacher') return teacherClassIds(user._id);

  return [];
}

const listScopedTimetable = async (req, res) => {
  try {
    const user = req.schoolUser;
    const filter = { isActive: true };

    for (const key of ['dayOfWeek', 'academicYear', 'term']) {
      if (req.query[key] !== undefined && req.query[key] !== '') filter[key] = req.query[key];
    }

    if (user.role === 'admin') {
      if (req.query.schoolClass) filter.schoolClass = req.query.schoolClass;
      if (req.query.stream) filter.stream = req.query.stream;
      if (req.query.teacher) filter.teacher = req.query.teacher;
    } else if (['teacher', 'pupil', 'parent', 'sponsor'].includes(user.role)) {
      const classIds = await allowedClassIdsForUser(user);
      filter.schoolClass = { $in: classIds };
    } else {
      return res.status(403).json({ success: false, message: 'You do not have permission to view timetables.' });
    }

    const rows = await populate(
      Timetable.find(filter).sort({ dayOfWeek: 1, period: 1, startTime: 1, schoolClass: 1 })
    ).lean();

    return res.json({
      success: true,
      scope: user.role === 'admin' ? 'school' : 'assigned-class',
      data: rows,
    });
  } catch (error) {
    console.error('Scoped timetable error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load timetable' });
  }
};

module.exports = { listScopedTimetable };
