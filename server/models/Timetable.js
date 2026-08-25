import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true, index: true },
  stream: { type: String, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  dayOfWeek: { type: Number, min: 1, max: 7, required: true, index: true },
  period: { type: Number, min: 1, required: true },
  startTime: { type: String, trim: true, required: true },
  endTime: { type: String, trim: true, required: true },
  room: { type: String, trim: true },
  academicYear: { type: String, trim: true, required: true, index: true },
  term: { type: String, trim: true, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

timetableSchema.index({ schoolClass: 1, stream: 1, dayOfWeek: 1, period: 1, academicYear: 1, term: 1 }, { unique: true });
timetableSchema.index({ teacher: 1, dayOfWeek: 1, period: 1, academicYear: 1, term: 1 }, { unique: true, sparse: true });

export default mongoose.model('Timetable', timetableSchema);
