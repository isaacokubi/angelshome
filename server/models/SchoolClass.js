const mongoose = require("mongoose");
const schoolClassSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  stream: { type: String, trim: true, default: "" },
  academicYear: { type: String, required: true, trim: true },
  capacity: { type: Number, min: 1, default: 40 },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schoolClassSchema.index({ name: 1, stream: 1, academicYear: 1 }, { unique: true });
module.exports = mongoose.model("SchoolClass", schoolClassSchema);
