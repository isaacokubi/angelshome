const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  date: { type: Date, required: true, index: true }, breakfast: { type: String, trim: true },
  lunch: { type: String, trim: true }, snack: { type: String, trim: true }, dinner: { type: String, trim: true },
  notes: { type: String, trim: true }, isPublished: { type: Boolean, default: false, index: true },
}, { timestamps: true });
module.exports = mongoose.model("MealPlan", schema);
