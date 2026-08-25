const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  teacherCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 30, unique: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);
