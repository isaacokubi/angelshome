const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, pickupPoints: [{ type: String, trim: true }],
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  fee: { type: Number, min: 0, default: 0 }, departureTime: { type: String, trim: true },
  returnTime: { type: String, trim: true }, isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
module.exports = mongoose.model("TransportRoute", schema);
