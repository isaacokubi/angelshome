const express = require("express");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();
const normalizePhone = (value) => String(value || "").replace(/[\s()-]/g, "").trim();
const validPhone = (value) => /^\+?[0-9]{9,15}$/.test(value);
const signToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, parentPhone: u.parentPhone });

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "pupil" } = req.body || {};
    const phone = normalizePhone(req.body?.phone);
    const parentPhone = normalizePhone(req.body?.parentPhone);
    const childEmail = String(req.body?.childEmail || "").toLowerCase().trim();

    if (!name || !validator.isEmail(String(email || "")) || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Name, valid email and password of at least 8 characters are required" });
    }
    if (!["pupil", "teacher", "sponsor", "parent"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid self-registration role" });
    }
    if (!validPhone(phone)) return res.status(400).json({ success: false, message: "A valid phone number is required" });
    if (role === "pupil" && !validPhone(parentPhone)) {
      return res.status(400).json({ success: false, message: "A valid parent or guardian phone number is required for pupil registration" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    let verifiedChild = null;
    if (role === "parent") {
      if (!validator.isEmail(childEmail)) {
        return res.status(400).json({ success: false, message: "Enter the email address of your registered pupil" });
      }
      if (childEmail === normalizedEmail || phone === normalizePhone(childEmail)) {
        return res.status(400).json({ success: false, message: "A parent account must use the parent's own contact details" });
      }

      verifiedChild = await User.findOne({ email: childEmail, role: "pupil", isActive: true }).select("name email phone parentPhone");
      if (!verifiedChild || normalizePhone(verifiedChild.parentPhone) !== phone || normalizePhone(verifiedChild.phone) === phone) {
        return res.status(403).json({
          success: false,
          message: "Parent registration could not be verified. Use the parent/guardian phone number recorded for the pupil, or contact the school administrator."
        });
      }
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      phone,
      ...(role === "pupil" ? { parentPhone } : {}),
      ...(role === "parent" && verifiedChild ? { children: [verifiedChild._id] } : {})
    });

    return res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim(); const password = String(req.body?.password || "");
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.isActive || !(await user.verifyPassword(password))) return res.status(401).json({ success: false, message: "Invalid email or password" });
    return res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get("/me", requireSchoolAuth, (req, res) => res.json({ success: true, user: publicUser(req.schoolUser) }));
module.exports = router;
