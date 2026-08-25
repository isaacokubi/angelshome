const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", default: null },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["mpesa", "cash", "bank", "other"], required: true },
  reference: { type: String, trim: true, index: true },
  term: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  status: { type: String, enum: ["pending", "completed", "failed", "reversed"], default: "completed", index: true },
  receivedAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("FeePayment", schema);
