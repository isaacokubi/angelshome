const Timetable = require("../models/Timetable");

const populateTimetable = (query) => query
  .populate("schoolClass", "name stream academicYear")
  .populate("subject", "name code")
  .populate("teacher", "firstName lastName name email");

async function listTimetableData(academicYear, term) {
  return populateTimetable(
    Timetable.find({ academicYear, term, isActive: true }).sort({ dayOfWeek: 1, period: 1, schoolClass: 1 }),
  ).lean();
}

module.exports = { populateTimetable, listTimetableData };
