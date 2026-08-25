const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const FeeStructure = require("../models/FeeStructure");
const FeePayment = require("../models/FeePayment");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

const router = express.Router();
const admin = requireSchoolRole("admin");
const validId = (value) => mongoose.Types.ObjectId.isValid(value);

router.get("/summary", requireSchoolAuth, admin, async (req, res, next) => {
  try {
    const [structures, payments, pupils] = await Promise.all([
      FeeStructure.find().sort({ className: 1 }).lean(),
      FeePayment.find({ status: "completed" }).populate("pupil", "name email").sort({ receivedAt: -1 }).limit(500).lean(),
      User.find({ role: "pupil", isActive: true }).select("name email").sort({ name: 1 }).lean(),
    ]);
    const collected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const expected = structures.reduce((sum, fee) => sum + [fee.tuition, fee.boarding, fee.activity, fee.other].reduce((a, b) => a + Number(b || 0), 0), 0);
    const byMethod = payments.reduce((acc, payment) => { acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + Number(payment.amount || 0); return acc; }, {});
    return res.json({ success: true, structures, payments, pupils, summary: { collected, expected, outstanding: Math.max(expected - collected, 0), paymentCount: payments.length, byMethod } });
  } catch (error) { next(error); }
});

router.post("/structures", requireSchoolAuth, admin, async (req, res, next) => {
  try { const structure = await FeeStructure.create(req.body); return res.status(201).json({ success: true, structure }); } catch (error) { next(error); }
});
router.patch("/structures/:id", requireSchoolAuth, admin, async (req, res, next) => {
  try { const structure = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" }); return res.json({ success: true, structure }); } catch (error) { next(error); }
});
router.post("/payments", requireSchoolAuth, admin, async (req, res, next) => {
  try {
    const { pupil, amount, paymentMethod, reference, term, academicYear, feeStructure } = req.body || {};
    if (!validId(pupil) || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !["mpesa", "cash", "bank", "other"].includes(paymentMethod)) return res.status(400).json({ success: false, message: "Pupil, positive amount and valid payment method are required" });
    const payment = await FeePayment.create({ pupil, amount: Number(amount), paymentMethod, reference, term, academicYear, feeStructure: validId(feeStructure) ? feeStructure : null, recordedBy: req.schoolUser._id });
    const populated = await payment.populate("pupil", "name email");
    return res.status(201).json({ success: true, payment: populated });
  } catch (error) { next(error); }
});
router.get("/payments", requireSchoolAuth, admin, async (req, res, next) => {
  try { const filter = {}; if (validId(req.query.pupil)) filter.pupil = req.query.pupil; if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod; if (req.query.status) filter.status = req.query.status; const payments = await FeePayment.find(filter).populate("pupil", "name email").populate("recordedBy", "name").sort({ receivedAt: -1 }).limit(1000).lean(); return res.json({ success: true, payments }); } catch (error) { next(error); }
});

module.exports = router;
