const mongoose = require("mongoose");

const studentAcademicRecordSchema = new mongoose.Schema({
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  className: { type: String, trim: true, maxlength: 80 },
  attendanceRate: { type: Number, min: 0, max: 100, default: null },
  averageScore: { type: Number, min: 0, max: 100, default: null },
  subjectsCount: { type: Number, min: 0, default: null },
  assignmentsDue: { type: Number, min: 0, default: null },
}, { timestamps: true });

module.exports = mongoose.model("StudentAcademicRecord", studentAcademicRecordSchema);
