const mongoose = require('mongoose');

const lessonReminderSchema = new mongoose.Schema({
  timetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', required: true, index: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  occurrenceKey: { type: String, required: true, unique: true, index: true },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null },
  smsSentAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('LessonReminder', lessonReminderSchema);
