import Timetable from '../models/Timetable.js';

export const listTimetable = async (req, res) => {
  try {
    const filter = { isActive: true };
    for (const key of ['schoolClass', 'stream', 'teacher', 'dayOfWeek', 'academicYear', 'term']) if (req.query[key] !== undefined && req.query[key] !== '') filter[key] = req.query[key];
    const rows = await Timetable.find(filter).populate('schoolClass', 'name').populate('subject', 'name code').populate('teacher', 'firstName lastName name').sort({ dayOfWeek: 1, period: 1 }).lean();
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to load timetable', error: error.message }); }
};

export const createTimetable = async (req, res) => {
  try {
    const row = await Timetable.create(req.body);
    const populated = await Timetable.findById(row._id).populate('schoolClass', 'name').populate('subject', 'name code').populate('teacher', 'firstName lastName name').lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? 'Timetable conflict: this class or teacher already has this period.' : 'Unable to create timetable entry', error: error.message });
  }
};

export const deleteTimetable = async (req, res) => {
  try { await Timetable.findByIdAndUpdate(req.params.id, { isActive: false }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: 'Unable to remove timetable entry' }); }
};
