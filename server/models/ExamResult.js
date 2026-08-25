const mongoose = require("mongoose");
const examResultSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  marks: { type: Number, required: true, min: 0, max: 100 },
  maxMarks: { type: Number, default: 100, min: 1 },
  grade: { type: String, default: "" },
  teacherComment: { type: String, trim: true, default: "" },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
examResultSchema.index({ exam: 1, pupil: 1, subject: 1 }, { unique: true });
examResultSchema.methods.calculateGrade = function calculateGrade() {
  const percentage = (this.marks / this.maxMarks) * 100;
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
};
module.exports = mongoose.model("ExamResult", examResultSchema);
