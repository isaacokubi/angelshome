const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminController");
const settingsController = require("../controllers/settingsController");
const unlinkedPupilsController = require("../controllers/adminUnlinkedPupils");
const Announcement = require("../models/Announcement");
const Gallery = require("../models/Gallery");
const auth = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");

router.post("/login", controller.login);
router.get("/dashboard", auth, admin, controller.dashboard);
router.get("/unlinked-pupils", auth, admin, unlinkedPupilsController.getUnlinkedPupils);
router.get("/users", auth, admin, controller.getUsers);
router.post("/announcement", auth, admin, controller.createAnnouncement);
router.delete("/announcement/:id", auth, admin, controller.deleteAnnouncement);
router.get("/settings", auth, admin, settingsController.getAdminSettings);
router.put("/settings", auth, admin, settingsController.updateSettings);

router.get("/gallery", auth, admin, async (req, res) => {
  try {
    return res.json(await Gallery.find().sort({ sortOrder: -1, uploadedAt: -1 }).lean());
  } catch (error) {
    console.error("Admin gallery list error:", error);
    return res.status(500).json({ message: "Unable to load school media" });
  }
});

router.post("/gallery", auth, admin, async (req, res) => {
  try {
    const { title, url, image, mediaType, category, caption, isPublished, sortOrder } = req.body || {};
    const mediaUrl = String(url || image || "").trim();
    const type = mediaType === "video" ? "video" : "image";

    if (!title?.trim()) return res.status(400).json({ message: "A media title is required." });
    if (!mediaUrl) return res.status(400).json({ message: "A media URL is required." });
    if (mediaUrl.length > 12000000) return res.status(400).json({ message: "Media data is too large. Use a hosted media URL for large files." });

    const item = await Gallery.create({
      title: title.trim(),
      image: type === "image" ? mediaUrl : "",
      url: mediaUrl,
      mediaType: type,
      category: category?.trim() || "General",
      caption: caption?.trim() || "",
      isPublished: isPublished !== false,
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("Admin gallery create error:", error);
    return res.status(400).json({ message: error.message || "Unable to create media item" });
  }
});

router.patch("/gallery/:id", auth, admin, async (req, res) => {
  try {
    const allowed = ["title", "url", "image", "mediaType", "category", "caption", "isPublished", "sortOrder"];
    const update = Object.fromEntries(allowed.filter((key) => req.body?.[key] !== undefined).map((key) => [key, req.body[key]]));
    if (update.url && !update.image && update.mediaType !== "video") update.image = update.url;
    const item = await Gallery.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!item) return res.status(404).json({ message: "Media item not found." });
    return res.json(item);
  } catch (error) {
    console.error("Admin gallery update error:", error);
    return res.status(400).json({ message: error.message || "Unable to update media item" });
  }
});

router.delete("/gallery/:id", auth, admin, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Media item not found." });
    return res.json({ success: true });
  } catch (error) {
    console.error("Admin gallery delete error:", error);
    return res.status(400).json({ message: error.message || "Unable to delete media item" });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1, createdAt: -1 }).limit(5).lean();
    return res.json(announcements);
  } catch (error) {
    console.error("Public announcements error:", error);
    return res.status(500).json({ message: "Unable to load announcements" });
  }
});

module.exports = router;
