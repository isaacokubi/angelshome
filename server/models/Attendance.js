const mongoose = require("mongoose");
const attendanceSchema = new mongoose.Schema({
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", default: null },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "sick", "late"], required: true },
  note: { type: String, trim: true, default: "" },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
attendanceSchema.index({ pupil: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("Attendance", attendanceSchema);
