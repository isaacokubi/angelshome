const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.pre("save", async function(next) { if (this.isCurrent) await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isCurrent: false } }); next(); });
module.exports = mongoose.model("AcademicYear", schema);
