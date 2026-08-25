const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, trim: true, default: "" }, className: { type: String, trim: true, default: "" },
  term: { type: String, trim: true, default: "" }, academicYear: { type: String, trim: true, default: "" },
  amount: { type: Number, min: 0, default: 0 }, tuition: { type: Number, min: 0, default: 0 },
  boarding: { type: Number, min: 0, default: 0 }, activity: { type: Number, min: 0, default: 0 }, other: { type: Number, min: 0, default: 0 },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", default: null }, dueDate: { type: Date },
  description: { type: String, trim: true }, isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ name: 1, term: 1, academicYear: 1, schoolClass: 1 });
module.exports = mongoose.model("FeeStructure", schema);
