const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const validator = require("validator");
const User = require("../models/User");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

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

    if (!name || !validator.isEmail(String(email || "")) || typeof password !== "string" || password.length < 8) return res.status(400).json({ success: false, message: "Name, valid email and password of at least 8 characters are required" });
    if (!["pupil", "teacher", "sponsor", "parent"].includes(role)) return res.status(400).json({ success: false, message: "Invalid self-registration role" });
    if (!validPhone(phone)) return res.status(400).json({ success: false, message: "A valid phone number is required" });
    if (role === "pupil" && !validPhone(parentPhone)) return res.status(400).json({ success: false, message: "A valid parent or guardian phone number is required for pupil registration" });

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "An account with this email already exists" });

    let verifiedChild = null;
    if (role === "parent") {
      if (!validator.isEmail(childEmail)) return res.status(400).json({ success: false, message: "Enter the email address of your registered pupil" });
      if (childEmail === normalizedEmail || phone === normalizePhone(childEmail)) return res.status(400).json({ success: false, message: "A parent account must use the parent's own contact details" });
      verifiedChild = await User.findOne({ email: childEmail, role: "pupil", isActive: true }).select("name email phone parentPhone");
      if (!verifiedChild || normalizePhone(verifiedChild.parentPhone) !== phone || normalizePhone(verifiedChild.phone) === phone) return res.status(403).json({ success: false, message: "Parent registration could not be verified. Use the parent/guardian phone number recorded for the pupil, or contact the school administrator." });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, role, phone, ...(role === "pupil" ? { parentPhone } : {}), ...(role === "parent" && verifiedChild ? { children: [verifiedChild._id] } : {}) });
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

// Account phone changes. Pupils cannot self-edit. Parent changes are propagated
// to every linked pupil, including legacy pupils linked by the previous parent phone.
router.patch("/phone", requireSchoolAuth, async (req, res, next) => {
  try {
    const user = req.schoolUser;
    const phone = normalizePhone(req.body?.phone);
    if (user.role === "pupil") return res.status(403).json({ success: false, message: "Pupil phone numbers can only be changed by a school administrator." });
    if (!validPhone(phone)) return res.status(400).json({ success: false, message: "Enter a valid phone number." });

    if (user.role === "parent") {
      const oldPhone = normalizePhone(user.phone);
      const updatedParent = await User.findByIdAndUpdate(user._id, { $set: { phone } }, { new: true, runValidators: true });
      if (!updatedParent) return res.status(404).json({ success: false, message: "Parent account not found." });

      const linkedIds = Array.isArray(updatedParent.children)
        ? updatedParent.children.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => id.toString())
        : [];
      const linkedPupils = await User.find({
        role: "pupil",
        isActive: true,
        $or: [
          { _id: { $in: linkedIds } },
          ...(oldPhone ? [{ parentPhone: oldPhone }] : []),
        ],
      }).select("_id").lean();
      const pupilIds = [...new Set(linkedPupils.map((pupil) => pupil._id.toString()))];

      if (pupilIds.length) {
        await User.updateMany(
          { _id: { $in: pupilIds }, role: "pupil" },
          { $set: { phone, parentPhone: phone } },
        );
      }

      return res.json({ success: true, message: "Phone number updated. All linked pupils have been synchronized with the new parent number.", user: publicUser(updatedParent), syncedPupils: pupilIds.length });
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, { $set: { phone } }, { new: true, runValidators: true });
    if (!updatedUser) return res.status(404).json({ success: false, message: "User account not found." });
    return res.json({ success: true, message: "Phone number updated successfully.", user: publicUser(updatedUser), syncedPupils: 0 });
  } catch (error) { next(error); }
});

// Admin correction for a pupil whose stored number is wrong. The administrator
// may provide the verified parent's number; the pupil's phone and parentPhone
// are always kept identical after the correction.
router.patch("/phone/pupils/:id", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const phone = normalizePhone(req.body?.phone);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid pupil account." });
    if (!validPhone(phone)) return res.status(400).json({ success: false, message: "Enter a valid parent/guardian phone number." });

    const pupil = await User.findOne({ _id: id, role: "pupil", isActive: true });
    if (!pupil) return res.status(404).json({ success: false, message: "Pupil account not found." });

    const parent = await User.findOne({ role: "parent", isActive: true, phone }).select("_id name phone").lean();
    pupil.phone = phone;
    pupil.parentPhone = phone;
    await pupil.save();

    return res.json({
      success: true,
      message: parent
        ? `Pupil phone corrected and synchronized with parent ${parent.name}.`
        : "Pupil phone corrected successfully. The pupil phone and parent contact field now use the supplied verified number.",
      user: publicUser(pupil),
      matchedParent: parent ? { id: parent._id, name: parent.name, phone: parent.phone } : null,
    });
  } catch (error) { next(error); }
});

module.exports = router;
