require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const User = require("../models/User");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");
const LearningRecord = require("../models/LearningRecord");
const LibraryBook = require("../models/LibraryBook");

const YEAR = String(new Date().getFullYear());

const books = [
  ["Mathematics for Primary Schools", "School Mathematics Department", "Mathematics", "Mathematics", "A-01", 5],
  ["English Language Skills", "School English Department", "Languages", "English", "A-02", 5],
  ["Kiswahili Reader", "School Languages Department", "Languages", "Kiswahili", "A-03", 5],
  ["Integrated Science", "School Science Department", "Science", "Integrated Science", "A-04", 4],
  ["Social Studies and Citizenship", "School Humanities Department", "Social Studies", "Social Studies", "A-05", 4],
  ["Computer Studies", "School ICT Department", "Technology", "Computer Studies", "A-06", 4],
  ["Creative Arts Handbook", "School Creative Arts Department", "Creative Arts", "Creative Arts", "A-07", 3],
  ["Physical Education Guide", "School Sports Department", "Physical Education", "Physical Education", "A-08", 3],
  ["Agriculture Basics", "School Agriculture Department", "Agriculture", "Agriculture", "A-09", 3],
  ["Life Skills for Learners", "School Guidance Department", "Life Skills", "Life Skills", "A-10", 4],
];

async function run() {
  await connectDatabase();

  const pupils = await User.find({ role: "pupil", isActive: true }).select("_id classId").sort({ email: 1 }).limit(50).lean();
  const teachers = await User.find({ role: "teacher", isActive: true }).select("_id").sort({ email: 1 }).lean();
  const subjects = await Subject.find({ isActive: true }).sort({ code: 1, name: 1 }).limit(50).lean();

  if (!pupils.length) throw new Error("No active pupils found.");
  if (!teachers.length) throw new Error("No active teachers found.");
  if (!subjects.length) throw new Error("No active subjects found.");

  const timetable = await Timetable.find({ academicYear: YEAR, isActive: true })
    .select("schoolClass subject teacher")
    .lean();

  const teacherByClassSubject = new Map();
  timetable.forEach((row) => {
    const classId = String(row.schoolClass || "");
    const subjectId = String(row.subject || "");
    const teacherId = String(row.teacher || "");
    if (classId && subjectId && teacherId && !teacherByClassSubject.has(`${classId}|${subjectId}`)) {
      teacherByClassSubject.set(`${classId}|${subjectId}`, new mongoose.Types.ObjectId(teacherId));
    }
  });

  let learningCreated = 0;
  let learningUpdated = 0;
  for (const pupil of pupils) {
    const classSubjects = subjects.filter((subject) => teacherByClassSubject.has(`${String(pupil.classId || "")}|${subject._id}`));
    const usableSubjects = classSubjects.length ? classSubjects : subjects;
    for (const subject of usableSubjects.slice(0, 10)) {
      const teacherId = teacherByClassSubject.get(`${String(pupil.classId || "")}|${subject._id}`) || teachers[(learningCreated + learningUpdated) % teachers.length]._id;
      const existing = await LearningRecord.findOne({ pupil: pupil._id, subject: subject.name }).select("_id").lean();
      await LearningRecord.findOneAndUpdate(
        { pupil: pupil._id, subject: subject.name },
        {
          $set: {
            pupil: pupil._id,
            subject: subject.name,
            teacher: teacherId,
            progress: null,
            nextLesson: null,
          },
          $setOnInsert: {},
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (existing) learningUpdated += 1;
      else learningCreated += 1;
    }
  }

  let libraryTouched = 0;
  for (const [title, author, category, subject, location, totalCopies] of books) {
    await LibraryBook.findOneAndUpdate(
      { title },
      {
        $set: {
          title,
          author,
          category,
          subject,
          publisher: "Angels Home Education Centre",
          year: Number(YEAR),
          location,
          description: `School library resource for ${subject}.`,
          totalCopies,
          isActive: true,
        },
        $setOnInsert: {
          availableCopies: totalCopies,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    libraryTouched += 1;
  }

  const activeBooks = await LibraryBook.find({ isActive: true }).lean();
  for (const book of activeBooks) {
    const activeLoans = book.loans.filter((loan) => ["active", "overdue"].includes(loan.status)).length;
    const available = Math.max(0, Number(book.totalCopies || 0) - activeLoans);
    await LibraryBook.updateOne(
      { _id: book._id },
      { $set: { availableCopies: Math.min(Number(book.totalCopies || 0), available) } }
    );
  }

  const activeBookCount = await LibraryBook.countDocuments({ isActive: true });
  const learningCount = await LearningRecord.countDocuments({});
  const activeLearningTeachers = await LearningRecord.aggregate([
    { $match: { teacher: { $ne: null } } },
    { $group: { _id: "$teacher", count: { $sum: 1 } } },
  ]);

  console.log(JSON.stringify({
    success: true,
    academicYear: YEAR,
    pupils: pupils.length,
    teachers: teachers.length,
    subjects: subjects.length,
    learningRecords: learningCount,
    learningCreated,
    learningUpdated,
    teachersWithLearningRecords: activeLearningTeachers.length,
    libraryTitles: activeBookCount,
    libraryTouched,
    message: "Teacher learning records and library catalogue aligned with active school data.",
  }, null, 2));

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Teacher workspace alignment seed failed:", error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
