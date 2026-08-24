const express = require("express");
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Name, email and message are required" });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Message received successfully",
      contact: { id: contact._id },
    });
  } catch (error) {
    console.error("Contact creation error:", error);
    return res.status(500).json({ success: false, message: "Unable to send message" });
  }
});

router.get("/", auth, admin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).lean();
    return res.json(messages);
  } catch (error) {
    console.error("Contact listing error:", error);
    return res.status(500).json({ message: "Unable to load messages" });
  }
});

module.exports = router;
