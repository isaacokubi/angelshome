const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const controller = require("../controllers/adminController");
const settingsController = require("../controllers/settingsController");
const unlinkedPupilsController = require("../controllers/adminUnlinkedPupils");
const Announcement = require("../models/Announcement");
const Gallery = require("../models/Gallery");
const auth = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");
const { authLimiter } = require("../middleware/security");

router.post("/login", authLimiter, controller.login);
router.get("/dashboard", auth, admin, controller.dashboard);
router.get("/unlinked-pupils", auth, admin, unlinkedPupilsController.getUnlinkedPupils);
router.get("/users", auth, admin, controller.getUsers);
router.post("/announcement", auth, admin, controller.createAnnouncement);
router.delete("/announcement/:id", auth, admin, controller.deleteAnnouncement);
router.get("/settings", auth, admin, settingsController.getAdminSettings);
router.put("/settings", auth, admin, settingsController.updateSettings);

router.post("/gallery/upload-signature", auth, admin, async (req, res) => {
  try {
    const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
    const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(503).json({ message: "Large media uploads are not configured. Add the Cloudinary storage environment variables to the API." });
    }

    const mediaType = req.body?.mediaType === "video" ? "video" : "image";
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "angels-home/gallery";
    const stringToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(stringToSign + apiSecret).digest("hex");

    return res.json({ cloudName, apiKey, timestamp, signature, folder, mediaType, maxVideoBytes: 100 * 1024 * 1024, maxImageBytes: 10 * 1024 * 1024 });
  } catch (error) {
    console.error("Gallery upload signature error:", error);
    return res.status(500).json({ message: "Unable to prepare media upload" });
  }
});

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
    const { title, url, image, mediaType, category, caption, isPublished, sortOrder, consentConfirmed, consentNote } = req.body || {};
    const mediaUrl = String(url || image || "").trim();
    const type = mediaType === "video" ? "video" : "image";

    if (!title?.trim()) return res.status(400).json({ message: "A media title is required." });
    if (!consentConfirmed) return res.status(400).json({ message: "Confirm that you have permission to publish this school media before publishing it." });
    if (!mediaUrl) return res.status(400).json({ message: "A media URL is required." });
    if (mediaUrl.startsWith("data:")) return res.status(400).json({ message: "Direct base64 media is no longer accepted. Upload the file to cloud storage or provide a hosted URL." });
    if (mediaUrl.length > 2000000) return res.status(400).json({ message: "Media URL is too large. Upload the file to cloud storage instead." });

    const item = await Gallery.create({
      title: title.trim(),
      image: type === "image" ? mediaUrl : "",
      url: mediaUrl,
      mediaType: type,
      category: category?.trim() || "General",
      caption: caption?.trim() || "",
      isPublished: isPublished !== false,
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      consentConfirmed: Boolean(consentConfirmed),
      consentNote: String(consentNote || "").trim(),
      consentRecordedAt: consentConfirmed ? new Date() : null,
      consentRecordedBy: consentConfirmed ? (req.user?.sub || req.user?.id || null) : null,
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("Admin gallery create error:", error);
    return res.status(400).json({ message: error.message || "Unable to create media item" });
  }
});

router.patch("/gallery/:id", auth, admin, async (req, res) => {
  try {
    const allowed = ["title", "url", "image", "mediaType", "category", "caption", "isPublished", "sortOrder", "consentConfirmed", "consentNote"];
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
