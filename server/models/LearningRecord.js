const mongoose = require("mongoose");

const learningRecordSchema = new mongoose.Schema({
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 100 },
  nextLesson: { type: Date, default: null },
  progress: { type: Number, min: 0, max: 100, default: null },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
learningRecordSchema.index({ pupil: 1, subject: 1 }, { unique: true });
module.exports = mongoose.model("LearningRecord", learningRecordSchema);
