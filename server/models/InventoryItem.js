const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true }, category: { type: String, trim: true, index: true },
  quantity: { type: Number, min: 0, default: 0 }, unit: { type: String, trim: true, default: "item" },
  minimumStock: { type: Number, min: 0, default: 0 }, location: { type: String, trim: true },
  supplier: { type: String, trim: true }, unitCost: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true }, notes: { type: String, trim: true },
}, { timestamps: true });
module.exports = mongoose.model("InventoryItem", schema);
