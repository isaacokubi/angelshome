const Timetable = require('../models/Timetable');
const PupilProfile = require('../models/PupilProfile');

const populate = (query) => query
  .populate('schoolClass', 'name stream academicYear')
  .populate('subject', 'name code')
  .populate('teacher', 'firstName lastName name email');

const normalizeIds = (values) => (Array.isArray(values) ? values : [])
  .map((value) => value?._id || value?.id || value)
  .filter(Boolean)
  .map(String);

async function pupilClassIds(pupilIds) {
  const ids = normalizeIds(pupilIds);
  if (!ids.length) return [];
  const profiles = await PupilProfile.find({ pupil: { $in: ids }, status: 'active', schoolClass: { $ne: null } })
    .select('schoolClass')
    .lean();
  return [...new Set(profiles.map((profile) => String(profile.schoolClass)).filter(Boolean))];
}

async function parentClassIds(user) {
  const pupilIds = user.role === 'parent' ? user.children : user.sponsoredPupils;
  return pupilClassIds(pupilIds);
}

const listScopedTimetable = async (req, res) => {
  try {
    const user = req.schoolUser;
    const filter = { isActive: true };
    for (const key of ['dayOfWeek', 'academicYear', 'term']) {
      if (req.query[key] !== undefined && req.query[key] !== '') filter[key] = req.query[key];
    }

    let scope = 'assigned-class';
    if (user.role === 'admin') {
      if (req.query.schoolClass) filter.schoolClass = req.query.schoolClass;
      if (req.query.stream) filter.stream = req.query.stream;
      if (req.query.teacher) filter.teacher = req.query.teacher;
      scope = 'school';
    } else if (user.role === 'teacher') {
      filter.teacher = user._id;
      scope = 'teacher';
    } else if (user.role === 'pupil') {
      const classIds = await pupilClassIds([user._id]);
      if (!classIds.length) return res.json({ success: true, scope: 'pupil-class', data: [] });
      filter.schoolClass = { $in: classIds };
      scope = 'pupil-class';
    } else if (user.role === 'parent' || user.role === 'sponsor') {
      const classIds = await parentClassIds(user);
      if (!classIds.length) return res.json({ success: true, scope: user.role === 'parent' ? 'linked-pupil-classes' : 'sponsored-pupil-classes', data: [] });
      filter.schoolClass = { $in: classIds };
      scope = user.role === 'parent' ? 'linked-pupil-classes' : 'sponsored-pupil-classes';
    } else {
      return res.status(403).json({ success: false, message: 'You do not have permission to view timetables.' });
    }

    const rows = await populate(Timetable.find(filter).sort({ dayOfWeek: 1, period: 1, startTime: 1, schoolClass: 1 })).lean();
    return res.json({ success: true, scope, data: rows });
  } catch (error) {
    console.error('Scoped timetable error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load timetable' });
  }
};

module.exports = { listScopedTimetable };
