const express = require("express");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const router = express.Router();
const AUDIENCES = ["all", "admin", "teacher", "pupil", "sponsor", "parent"];
const BROADCAST_AUDIENCES = ["all", "admin", "teacher", "pupil", "sponsor", "parent"];
router.use(requireSchoolAuth);
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const docs = await Notification.find({ $or: [{ recipient: req.schoolUser._id }, { recipient: null, audience: "all" }, { recipient: null, audience: req.schoolUser.role }] }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, notifications: docs });
  } catch (e) { next(e); }
});
router.patch("/:id/read", async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, recipient: req.schoolUser._id }, { $set: { readAt: new Date() } });
    res.json({ success: true });
  } catch (e) { next(e); }
});
router.post("/broadcast", requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    const audience = String(req.body?.audience || "all").trim();
    if (!title || !message) return res.status(400).json({ success: false, message: "Title and message are required" });
    if (title.length > 160 || message.length > 2000) return res.status(400).json({ success: false, message: "Title must be 160 characters or fewer and message 2,000 characters or fewer" });
    if (!BROADCAST_AUDIENCES.includes(audience)) return res.status(400).json({ success: false, message: `Audience must be one of: ${BROADCAST_AUDIENCES.join(", ")}` });
    const recipients = audience === "all" ? null : await User.find({ role: audience, isActive: true }).select("_id").lean();
    const docs = recipients ? recipients.map((u) => ({ recipient: u._id, audience, title, message })) : [{ audience: "all", title, message }];
    if (!docs.length) return res.status(200).json({ success: true, count: 0, message: "No active recipients matched the selected audience" });
    await Notification.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, count: docs.length });
  } catch (e) { next(e); }
});
module.exports = router;
