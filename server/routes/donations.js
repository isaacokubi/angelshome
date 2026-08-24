const express = require("express");
const Donation = require("../models/Donation");
const auth = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { donorName, phone, email, amount, paymentMethod, project } = req.body || {};
    const numericAmount = Number(amount);

    if (!phone?.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Valid phone and donation amount are required" });
    }

    if (!["MPESA", "PAYPAL"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Unsupported payment method" });
    }

    const donation = await Donation.create({
      donorName: donorName?.trim() || "Anonymous",
      phone: phone.trim(),
      email: email?.trim().toLowerCase() || undefined,
      amount: numericAmount,
      paymentMethod,
      project: project?.trim() || undefined,
      // Never accept client-controlled payment status.
      status: "Pending",
    });

    return res.status(201).json({ success: true, message: "Donation record created", donation });
  } catch (error) {
    console.error("Donation creation error:", error);
    return res.status(500).json({ success: false, message: "Unable to create donation record" });
  }
});

// Donation records contain donor PII and are admin-only.
router.get("/", auth, admin, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).lean();
    return res.json(donations);
  } catch (error) {
    console.error("Donation listing error:", error);
    return res.status(500).json({ message: "Unable to load donations" });
  }
});

module.exports = router;
