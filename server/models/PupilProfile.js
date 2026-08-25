const mongoose = require("mongoose");
const pupilProfileSchema = new mongoose.Schema({
  pupil: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  admissionNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ["male", "female", "other", "unspecified"], default: "unspecified" },
  photoUrl: { type: String, trim: true, default: "" },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", default: null },
  medical: { allergies: { type: String, default: "" }, conditions: { type: String, default: "" }, medication: { type: String, default: "" } },
  emergencyContacts: [{ name: String, relationship: String, phone: String }],
  status: { type: String, enum: ["active", "transferred", "graduated", "alumni", "withdrawn"], default: "active", index: true },
}, { timestamps: true });
module.exports = mongoose.model("PupilProfile", pupilProfileSchema);
