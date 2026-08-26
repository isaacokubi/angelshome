const express = require("express");
const User = require("../models/User");
const SchoolClass = require("../models/SchoolClass");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const LearningContent = require("../models/LearningContent");
const LearningRecord = require("../models/LearningRecord");
const LibraryBook = require("../models/LibraryBook");
const ClassSubjectAllocation = require("../models/ClassSubjectAllocation");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();

const countActive = (role) => User.countDocuments({ role, isActive: true });

router.get("/", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const academicYear = String(new Date().getFullYear());

    const activeClassIds = await SchoolClass.find({ isActive: true, academicYear }).distinct("_id");

    const [pupils, teachers, parents, sponsors, classes, allocatedSubjectIds, exams, openExams, results, resultsToday, attendanceToday, library] = await Promise.all([
      countActive("pupil"),
      countActive("teacher"),
      countActive("parent"),
      countActive("sponsor"),
      SchoolClass.countDocuments({ isActive: true, academicYear }),
      ClassSubjectAllocation.distinct("subject", { isActive: true, academicYear, schoolClass: { $in: activeClassIds } }),
      Exam.countDocuments(),
      Exam.countDocuments({ status: "open" }),
      ExamResult.countDocuments(),
      ExamResult.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Attendance.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      LibraryBook.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            titles: { $sum: 1 },
            copies: { $sum: "$totalCopies" },
            available: { $sum: "$availableCopies" },
            activeLoans: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$loans",
                    as: "loan",
                    cond: { $in: ["$$loan.status", ["active", "overdue"]] },
                  },
                },
              },
            },
            overdue: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$loans",
                    as: "loan",
                    cond: { $eq: ["$$loan.status", "overdue"] },
                  },
                },
              },
            },
            reservations: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$reservations",
                    as: "reservation",
                    cond: { $eq: ["$$reservation.status", "pending"] },
                  },
                },
              },
            },
          },
        },
      ]),
    ]);

    const attendance = Object.fromEntries(attendanceToday.map((item) => [item._id, item.count]));
    const marked = Object.values(attendance).reduce((sum, value) => sum + Number(value || 0), 0);
    const libraryStats = library[0] || { titles: 0, copies: 0, available: 0, activeLoans: 0, overdue: 0, reservations: 0 };

    let teacher = null;
    let pupil = null;

    if (user.role === "teacher") {
      const timetableClassIds = await require("../models/Timetable").distinct("schoolClass", {
        teacher: user._id,
        isActive: true,
        academicYear,
      });
      const timetableSubjectIds = await require("../models/Timetable").distinct("subject", {
        teacher: user._id,
        isActive: true,
        academicYear,
      });
      const [classCount, subjectCount, contentCount, submittedCount] = await Promise.all([
        SchoolClass.countDocuments({ _id: { $in: timetableClassIds }, isActive: true, academicYear }),
        Subject.countDocuments({ _id: { $in: timetableSubjectIds }, isActive: true }),
        LearningContent.countDocuments({ teacher: user._id, published: true }),
        ExamResult.countDocuments({ enteredBy: user._id }),
      ]);
      teacher = { classes: classCount, subjects: subjectCount, publishedContent: contentCount, resultsEntered: submittedCount };
    }

    if (user.role === "pupil") {
      const classId = user.classId || null;
      const [contentCount, learningCount] = await Promise.all([
        classId
          ? LearningContent.countDocuments({ classId, published: true })
          : 0,
        LearningRecord.countDocuments({ pupil: user._id }),
      ]);
      pupil = {
        classId,
        publishedLearning: contentCount,
        learningRecords: learningCount,
      };
    }

    return res.json({
      success: true,
      role: user.role,
      school: {
        pupils,
        teachers,
        parents,
        sponsors,
        classes,
        subjects: allocatedSubjectIds.length,
        exams,
        openExams,
        results,
        resultsToday,
        attendanceToday: {
          ...attendance,
          totalMarked: marked,
          attendanceRate: marked ? Math.round(((attendance.present || 0) / marked) * 100) : null,
        },
        library: libraryStats,
      },
      teacher,
      pupil,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
