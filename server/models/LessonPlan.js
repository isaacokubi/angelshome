const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
  academicYear: { type: String, required: true, trim: true }, term: { type: String, trim: true },
  week: { type: Number, min: 1 }, topic: { type: String, required: true, trim: true },
  objectives: [{ type: String, trim: true }], activities: [{ type: String, trim: true }],
  resources: [{ type: String, trim: true }], assessment: { type: String, trim: true },
  lessonDate: { type: Date }, status: { type: String, enum: ["planned","taught","cancelled"], default: "planned" },
}, { timestamps: true });
schema.index({ schoolClass: 1, subject: 1, lessonDate: 1 });
module.exports = mongoose.model("LessonPlan", schema);
