const Timetable = require('../models/Timetable');

const populate = (query) => query
  .populate('schoolClass', 'name stream academicYear')
  .populate('subject', 'name code')
  .populate('teacher', 'firstName lastName name email');

const listTimetable = async (req, res) => {
  try {
    const filter = { isActive: true };
    for (const key of ['schoolClass', 'stream', 'teacher', 'dayOfWeek', 'academicYear', 'term']) {
      if (req.query[key] !== undefined && req.query[key] !== '') filter[key] = req.query[key];
    }
    const rows = await populate(Timetable.find(filter).sort({ dayOfWeek: 1, period: 1 })).lean();
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

module.exports = { listTimetable, createTimetable, updateTimetable, deleteTimetable };
