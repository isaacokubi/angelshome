const express = require("express");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const { requireSchoolAuth } = require("../middleware/schoolAuth");

const router = express.Router();
const signToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone });

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "pupil", phone } = req.body || {};
    if (!name || !validator.isEmail(String(email || "")) || typeof password !== "string" || password.length < 8) return res.status(400).json({ success: false, message: "Name, valid email and password of at least 8 characters are required" });
    if (!["pupil", "teacher", "sponsor", "parent"].includes(role)) return res.status(400).json({ success: false, message: "Invalid self-registration role" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "An account with this email already exists" });
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, role, phone });
    return res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
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
