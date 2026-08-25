const mongoose = require("mongoose");
const examSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["cat", "midterm", "end_term", "mock", "national_prep", "other"], required: true },
  term: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true, trim: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  status: { type: String, enum: ["draft", "open", "closed", "published"], default: "draft", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
examSchema.index({ name: 1, term: 1, academicYear: 1 }, { unique: true });
module.exports = mongoose.model("Exam", examSchema);
