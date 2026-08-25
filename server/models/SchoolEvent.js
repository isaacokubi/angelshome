const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, description: { type: String, trim: true },
  startAt: { type: Date, required: true, index: true }, endAt: { type: Date }, location: { type: String, trim: true },
  audience: { type: String, enum: ["all","pupils","parents","teachers","sponsors"], default: "all" },
  isPublished: { type: Boolean, default: true, index: true }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
module.exports = mongoose.model("SchoolEvent", schema);
