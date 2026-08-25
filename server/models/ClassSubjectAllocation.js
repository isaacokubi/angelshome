const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
  academicYear: { type: String, required: true, trim: true, index: true },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

schema.index({ schoolClass: 1, subject: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("ClassSubjectAllocation", schema);
