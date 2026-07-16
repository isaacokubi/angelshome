const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    phone: String,
    amount: Number,
    receipt: String,
    status: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);