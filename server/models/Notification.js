const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  audience: { type: String, enum: ["all", "admin", "teacher", "pupil", "sponsor", "parent"], default: "all", index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  channel: { type: String, enum: ["in_app", "whatsapp", "sms"], default: "in_app" },
  kind: { type: String, enum: ["general", "lesson_reminder"], default: "general", index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });
module.exports = mongoose.model("Notification", notificationSchema);
