const express = require("express");
const User = require("../models/User");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const { sendWhatsAppText } = require("../services/whatsapp");
const router = express.Router();
router.post("/send", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => { try { const { userId, message } = req.body || {}; if (!userId || !message || message.length > 4096) return res.status(400).json({ success: false, message: "userId and a message up to 4096 characters are required" }); const user = await User.findById(userId).lean(); if (!user?.phone) return res.status(400).json({ success: false, message: "Recipient has no phone number" }); const result = await sendWhatsAppText(user.phone, message); res.json({ success: true, messageId: result?.messages?.[0]?.id || null }); } catch (e) { next(e); } });
module.exports = router;
