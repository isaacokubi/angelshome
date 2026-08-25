const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  term: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", default: null },
  dueDate: { type: Date },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ name: 1, term: 1, academicYear: 1, schoolClass: 1 });
module.exports = mongoose.model("FeeStructure", schema);
