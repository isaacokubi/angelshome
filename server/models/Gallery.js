const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    image: { type: String, default: "" },
    url: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    category: { type: String, default: "General", trim: true, maxlength: 80 },
    caption: { type: String, default: "", trim: true, maxlength: 500 },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    consentConfirmed: { type: Boolean, default: false },
    consentNote: { type: String, default: "", trim: true, maxlength: 500 },
    consentRecordedAt: { type: Date, default: null },
    consentRecordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ isPublished: 1, sortOrder: -1, uploadedAt: -1 });

module.exports = mongoose.model("Gallery", schema);
