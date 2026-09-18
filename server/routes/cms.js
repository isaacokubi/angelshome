const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const Gallery = require("../models/Gallery");

router.get("/settings", settingsController.getPublicSettings);

router.get("/gallery", async (req, res) => {
  try {
    const items = await Gallery.find({ isPublished: true })
      .sort({ sortOrder: -1, uploadedAt: -1 })
      .limit(60)
      .lean();

    return res.json(items.map((item) => ({ ...item, url: item.url || item.image })));
  } catch (error) {
    console.error("Public gallery error:", error);
    return res.status(500).json({ message: "Unable to load school media" });
  }
});

router.get("/staff", (req, res) => res.json([]));
router.get("/timeline", (req, res) => res.json([]));

module.exports = router;
