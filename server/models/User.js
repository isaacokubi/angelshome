const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roles = ["admin", "teacher", "pupil", "sponsor", "parent"];
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: roles, required: true, default: "pupil", index: true },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

userSchema.methods.verifyPassword = function verifyPassword(password) { return bcrypt.compare(password, this.passwordHash); };
userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 12);
module.exports = mongoose.model("User", userSchema);
