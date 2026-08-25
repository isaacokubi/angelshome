const Timetable = require('../models/Timetable');
const LessonReminder = require('../models/LessonReminder');
const Notification = require('../models/Notification');
const { sendSms } = require('./sms');

const POLL_MS = 30 * 1000;
const REMINDER_WINDOW_SECONDS = 5 * 60;
const TIME_ZONE = process.env.SCHOOL_TIMEZONE || 'Africa/Nairobi';

function getLocalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const weekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[values.weekday];
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek: weekday,
    seconds: Number(values.hour) * 3600 + Number(values.minute) * 60 + Number(values.second),
  };
}

function timeToSeconds(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 3600 + minute * 60;
}

async function deliverReminder(timetable, local) {
  const teacher = timetable.teacher;
  if (!teacher?._id) return;

  const occurrenceKey = `${local.dateKey}:${timetable._id}`;
  let reminder;
  try {
    reminder = await LessonReminder.create({ timetable: timetable._id, teacher: teacher._id, occurrenceKey });
  } catch (error) {
    if (error?.code === 11000) return;
    throw error;
  }

  const className = timetable.schoolClass?.name || 'your class';
  const subjectName = timetable.subject?.name || 'your lesson';
  const stream = timetable.schoolClass?.stream || timetable.stream;
  const classLabel = stream ? `${className} ${stream}` : className;
  const title = 'Lesson starting in 5 minutes';
  const message = `${subjectName} with ${classLabel} starts at ${timetable.startTime}. Please get ready for your lesson.`;

  try {
    const notification = await Notification.create({
      recipient: teacher._id,
      audience: 'teacher',
      title,
      message,
      channel: 'in_app',
      kind: 'lesson_reminder',
      metadata: {
        timetableId: timetable._id,
        dayOfWeek: timetable.dayOfWeek,
        period: timetable.period,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        subject: subjectName,
        className: classLabel,
      },
    });
    reminder.notificationId = notification._id;
    await reminder.save();
  } catch (error) {
    console.error('Lesson in-app notification failed:', error.message);
  }

  if (teacher.phone) {
    try {
      await sendSms(teacher.phone, `Angels Home: ${subjectName} for ${classLabel} starts in 5 minutes at ${timetable.startTime}.`);
      reminder.smsSentAt = new Date();
      await reminder.save();
    } catch (error) {
      console.error(`Lesson SMS failed for teacher ${teacher._id}:`, error.message);
    }
  }
}

async function checkLessonReminders() {
  const local = getLocalParts();
  if (!local.dayOfWeek) return;

  const rows = await Timetable.find({ dayOfWeek: local.dayOfWeek, isActive: true })
    .populate('teacher', 'name firstName lastName phone isActive role')
    .populate('subject', 'name code')
    .populate('schoolClass', 'name stream')
    .lean();

  for (const row of rows) {
    if (!row.teacher || row.teacher.role !== 'teacher' || row.teacher.isActive === false) continue;
    const startSeconds = timeToSeconds(row.startTime);
    if (startSeconds == null) continue;
    const secondsUntilStart = startSeconds - local.seconds;
    if (secondsUntilStart >= 0 && secondsUntilStart <= REMINDER_WINDOW_SECONDS) {
      await deliverReminder(row, local);
    }
  }
}

function startLessonReminderScheduler() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await checkLessonReminders();
    } catch (error) {
      console.error('Lesson reminder scheduler error:', error.message);
    } finally {
      running = false;
    }
  };

  void tick();
  return setInterval(tick, POLL_MS);
}

module.exports = { startLessonReminderScheduler, checkLessonReminders };
