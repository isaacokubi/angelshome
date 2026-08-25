const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  teacher: { type: String, required: true, trim: true },
  lessonsPerWeek: { type: Number, required: true, min: 1 },
}, { _id: false });

const classPlanSchema = new mongoose.Schema({
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true },
  lessons: { type: [lessonSchema], required: true },
}, { _id: false });

const periodSchema = new mongoose.Schema({
  period: { type: Number, required: true, min: 1 },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
}, { _id: false });

const schema = new mongoose.Schema({
  academicYear: { type: String, required: true, trim: true },
  term: { type: String, required: true, trim: true },
  periods: { type: [periodSchema], required: true },
  classPlans: { type: [classPlanSchema], required: true },
  generatedAt: { type: Date },
  generatedCount: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

schema.index({ academicYear: 1, term: 1 }, { unique: true });

module.exports = mongoose.model("SchoolTimetableConfig", schema);
