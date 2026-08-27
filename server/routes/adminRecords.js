const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");

const AcademicYear = require("../models/AcademicYear");
const Announcement = require("../models/Announcement");
const Attendance = require("../models/Attendance");
const ClassSubjectAllocation = require("../models/ClassSubjectAllocation");
const Contact = require("../models/Contact");
const Donation = require("../models/Donation");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const FeePayment = require("../models/FeePayment");
const FeeStructure = require("../models/FeeStructure");
const Gallery = require("../models/Gallery");
const HeroSlider = require("../models/HeroSlider");
const InventoryItem = require("../models/InventoryItem");
const LearningContent = require("../models/LearningContent");
const LearningRecord = require("../models/LearningRecord");
const LessonPlan = require("../models/LessonPlan");
const LessonReminder = require("../models/LessonReminder");
const LibraryBook = require("../models/LibraryBook");
const MealPlan = require("../models/MealPlan");
const Notification = require("../models/Notification");
const PupilProfile = require("../models/PupilProfile");
const SchoolClass = require("../models/SchoolClass");
const SchoolEvent = require("../models/SchoolEvent");
const SchoolSettings = require("../models/SchoolSettings");
const SchoolTimetableConfig = require("../models/SchoolTimetableConfig");
const Staff = require("../models/Staff");
const StudentAcademicRecord = require("../models/StudentAcademicRecord");
const Subject = require("../models/Subject");
const TeacherProfile = require("../models/TeacherProfile");
const Timetable = require("../models/Timetable");
const Transactions = require("../models/Transactions");
const TransportRoute = require("../models/TransportRoute");
const User = require("../models/User");

const SENSITIVE_FIELDS = new Set(["password", "passwordHash", "token", "resetToken", "refreshToken", "secret", "clientSecret", "accessToken"]);
const MODELS = {
  academicYears: { label: "Academic Years", model: AcademicYear }, announcements: { label: "Announcements", model: Announcement }, attendance: { label: "Attendance", model: Attendance },
  classSubjectAllocations: { label: "Class Subject Allocations", model: ClassSubjectAllocation }, contacts: { label: "Contacts", model: Contact }, donations: { label: "Donations", model: Donation }, exams: { label: "Exams", model: Exam }, examResults: { label: "Exam Results", model: ExamResult },
  feePayments: { label: "Fee Payments", model: FeePayment }, feeStructures: { label: "Fee Structures", model: FeeStructure }, gallery: { label: "Gallery", model: Gallery }, heroSliders: { label: "Hero Slides", model: HeroSlider }, inventory: { label: "Inventory", model: InventoryItem },
  learningContent: { label: "Learning Content", model: LearningContent }, learningRecords: { label: "Learning Records", model: LearningRecord }, lessonPlans: { label: "Lesson Plans", model: LessonPlan }, lessonReminders: { label: "Lesson Reminders", model: LessonReminder }, libraryBooks: { label: "Library Books", model: LibraryBook }, mealPlans: { label: "Meal Plans", model: MealPlan }, notifications: { label: "Notifications", model: Notification },
  pupilProfiles: { label: "Pupil Profiles", model: PupilProfile }, schoolClasses: { label: "Classes", model: SchoolClass }, schoolEvents: { label: "School Events", model: SchoolEvent }, schoolSettings: { label: "School Settings", model: SchoolSettings }, timetableConfig: { label: "Timetable Config", model: SchoolTimetableConfig }, staff: { label: "Staff", model: Staff }, studentAcademicRecords: { label: "Student Academic Records", model: StudentAcademicRecord }, subjects: { label: "Subjects", model: Subject }, teacherProfiles: { label: "Teacher Profiles", model: TeacherProfile }, timetable: { label: "Timetable", model: Timetable }, transactions: { label: "Transactions", model: Transactions }, transportRoutes: { label: "Transport Routes", model: TransportRoute }, users: { label: "Users", model: User },
};
const router = express.Router();
router.use(auth, admin);
function getResource(key, res) { const resource = MODELS[key]; if (!resource) { res.status(404).json({ success: false, message: "Unknown record type" }); return null; } return resource; }
function publicSchema(model) { return Object.entries(model.schema.paths).filter(([name]) => !["_id", "__v", "createdAt", "updatedAt"].includes(name) && !SENSITIVE_FIELDS.has(name)).map(([name, path]) => ({ name, label: name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()), type: path.instance, required: Boolean(path.isRequired), enumValues: Array.isArray(path.enumValues) ? path.enumValues : [], isArray: path.instance === "Array", ref: path.options?.ref || null })); }
function castForSchema(model, payload) { const out = {}; for (const [key, value] of Object.entries(payload || {})) { const schemaPath = model.schema.path(key); if (!schemaPath || key.startsWith("_") || ["createdAt", "updatedAt"].includes(key) || SENSITIVE_FIELDS.has(key)) continue; if (["Array", "Mixed", "Object"].includes(schemaPath.instance)) { if (typeof value === "string") { try { out[key] = JSON.parse(value); } catch { out[key] = value; } } else out[key] = value; continue; } try { out[key] = schemaPath.cast(value); } catch { out[key] = value; } } return out; }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
router.get("/", async (req, res, next) => { try { const types = await Promise.all(Object.entries(MODELS).map(async ([key, resource]) => ({ key, label: resource.label, count: await resource.model.countDocuments(), schema: publicSchema(resource.model) }))); return res.json({ success: true, types }); } catch (error) { return next(error); } });
router.get("/:type", async (req, res, next) => { try { const resource = getResource(req.params.type, res); if (!resource) return undefined; const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500); const search = String(req.query.search || "").trim(); const filter = {}; if (search) { const safe = escapeRegex(search); const paths = Object.entries(resource.model.schema.paths).filter(([name, path]) => path.instance === "String" && !SENSITIVE_FIELDS.has(name)).map(([name]) => ({ [name]: { $regex: safe, $options: "i" } })); if (paths.length) filter.$or = paths; } const records = await resource.model.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).lean(); return res.json({ success: true, type: req.params.type, label: resource.label, schema: publicSchema(resource.model), records }); } catch (error) { return next(error); } });
router.put("/:type/:id", async (req, res, next) => { try { const resource = getResource(req.params.type, res); if (!resource) return undefined; if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid record id" }); if (req.params.type === "users" && String(req.params.id) === String(req.user?._id) && req.body?.role && req.body.role !== "admin") return res.status(400).json({ success: false, message: "You cannot remove your own administrator role." }); const update = castForSchema(resource.model, req.body); const record = await resource.model.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).lean(); if (!record) return res.status(404).json({ success: false, message: "Record not found" }); return res.json({ success: true, record }); } catch (error) { return next(error); } });
router.delete("/:type/:id", async (req, res, next) => { try { const resource = getResource(req.params.type, res); if (!resource) return undefined; if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid record id" }); if (["schoolSettings", "timetableConfig"].includes(req.params.type)) return res.status(400).json({ success: false, message: "Configuration records cannot be deleted; edit them instead." }); if (resource.model === User && String(req.params.id) === String(req.user?._id)) return res.status(400).json({ success: false, message: "You cannot delete your own administrator account." }); if (resource.model === User) { const target = await User.findById(req.params.id).select("role").lean(); if (target?.role === "admin") return res.status(400).json({ success: false, message: "Administrator accounts are protected from deletion." }); } const deleted = await resource.model.findByIdAndDelete(req.params.id); if (!deleted) return res.status(404).json({ success: false, message: "Record not found" }); return res.json({ success: true, deletedId: deleted._id, message: `${resource.label.replace(/s$/, "")} deleted successfully.` }); } catch (error) { return next(error); } });
module.exports = router;
