const mongoose = require("mongoose");
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true, default: "" },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
subjectSchema.index({ code: 1 }, { unique: true });
module.exports = mongoose.model("Subject", subjectSchema);
