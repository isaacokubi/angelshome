const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  options: [{ type: String, trim: true, maxlength: 250 }],
  answer: { type: Number, min: 0 },
  marks: { type: Number, min: 1, default: 1 },
}, { _id: true });

const submissionSchema = new mongoose.Schema({
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: Number }],
  score: { type: Number, min: 0, default: 0 },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const learningContentSchema = new mongoose.Schema({
  type: { type: String, enum: ["lesson", "homework", "assignment", "exam"], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 10000, default: "" },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  dueDate: { type: Date, default: null },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  videoUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  meetingUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  materialUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  questions: [questionSchema],
  submissions: [submissionSchema],
  published: { type: Boolean, default: true, index: true },
}, { timestamps: true });

learningContentSchema.index({ classId: 1, published: 1, createdAt: -1 });
module.exports = mongoose.model("LearningContent", learningContentSchema);
