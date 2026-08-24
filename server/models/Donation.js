const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorName: { type: String, default: "Anonymous", trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ["MPESA", "PAYPAL"], required: true },
    transactionId: { type: String, default: null, trim: true },
    checkoutRequestId: { type: String, default: null, trim: true, index: true },
    merchantRequestId: { type: String, default: null, trim: true },
    project: { type: String, default: "General Development", trim: true },
    status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Donation", donationSchema);
