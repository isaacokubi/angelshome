const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Donation = require("../models/Donation");
const Contact = require("../models/Contact");
const Announcement = require("../models/Announcement");
const Notification = require("../models/Notification");
const StudentAcademicRecord = require("../models/StudentAcademicRecord");
const LearningRecord = require("../models/LearningRecord");

const getUsers = async (req, res) => {
  try {
    const users = await Admin.find().sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({ message: "Unable to load administrators" });
  }
};

const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || typeof password !== "string" || password.length < 10) {
    return res.status(400).json({ message: "Name, email and a password of at least 10 characters are required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await Admin.exists({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "An administrator with that email already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name: name.trim(), email: normalizedEmail, password: hashed, role: "admin" });
    return res.status(201).json({ message: "Admin created", admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "An administrator with that email already exists" });
    console.error("Admin registration error:", error);
    return res.status(500).json({ message: "Unable to create administrator" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || typeof password !== "string") return res.status(400).json({ message: "Email and password are required" });
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: "Authentication service is not configured" });

  try {
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!admin || admin.role !== "admin") return res.status(401).json({ message: "Invalid email or password" });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign({ id: String(admin._id), role: admin.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
    return res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Unable to sign in" });
  }
};

const dashboard = async (req, res) => {
  try {
    const [usersByRole, donations, messages, unreadNotifications, academicRecords, learningRecords, announcements] = await Promise.all([
      User.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
      Donation.find().sort({ createdAt: -1 }).limit(50).lean(),
      Contact.find().sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ readAt: null }),
      StudentAcademicRecord.countDocuments(),
      LearningRecord.countDocuments(),
      Announcement.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const roleCounts = Object.fromEntries(usersByRole.map((item) => [item._id, item.count]));
    const totalPupils = Number(roleCounts.pupil || 0);
    const academicCoverage = totalPupils ? Math.round((academicRecords / totalPupils) * 100) : 0;
    const totalDonationAmount = donations.filter((donation) => String(donation.status).toLowerCase() === "completed").reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
    const linkedParentPupils = await User.aggregate([
      { $match: { role: "parent", isActive: true } },
      { $project: { linked: { $size: { $ifNull: ["$children", []] } } } },
      { $group: { _id: null, linked: { $sum: "$linked" } } },
    ]);
    const linkedSponsorPupils = await User.aggregate([
      { $match: { role: "sponsor", isActive: true } },
      { $project: { linked: { $size: { $ifNull: ["$sponsoredPupils", []] } } } },
      { $group: { _id: null, linked: { $sum: "$linked" } } },
    ]);

    return res.json({
      totalDonations: donations.length,
      totalDonationAmount,
      totalMessages: messages.length,
      donations,
      messages,
      announcements,
      unreadNotifications,
      users: {
        total: Object.values(roleCounts).reduce((sum, count) => sum + Number(count || 0), 0),
        pupils: Number(roleCounts.pupil || 0),
        teachers: Number(roleCounts.teacher || 0),
        parents: Number(roleCounts.parent || 0),
        sponsors: Number(roleCounts.sponsor || 0),
        administrators: Number(roleCounts.admin || 0),
      },
      coordination: {
        academicCoverage,
        learningRecords,
        parentPupilLinks: Number(linkedParentPupils[0]?.linked || 0),
        sponsorPupilLinks: Number(linkedSponsorPupils[0]?.linked || 0),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ message: "Unable to load dashboard" });
  }
};

const createAnnouncement = async (req, res) => {
  const { title, content } = req.body || {};
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content are required" });
  try {
    const announcement = await Announcement.create({ title: title.trim(), content: content.trim() });
    return res.status(201).json({ message: "Announcement created", announcement });
  } catch (error) {
    console.error("Announcement error:", error);
    return res.status(500).json({ message: "Unable to create announcement" });
  }
};

const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Announcement id is required" });
  try {
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    return res.json({ message: "Announcement deleted" });
  } catch (error) {
    if (error?.name === "CastError") return res.status(400).json({ message: "Invalid announcement id" });
    console.error("Announcement deletion error:", error);
    return res.status(500).json({ message: "Unable to delete announcement" });
  }
};

module.exports = { getUsers, register, login, dashboard, createAnnouncement, deleteAnnouncement };
