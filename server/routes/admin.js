const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminController");
const Announcement = require("../models/Announcement");
const auth = require("../middleware/auth");
const admin = require("../middleware/adminMiddleware");

router.post("/login", controller.login);

// Administrator creation is intentionally not public. Use the server-side
// create-admin script with deployment secrets instead of exposing registration.

router.get("/dashboard", auth, admin, controller.dashboard);
router.get("/users", auth, admin, controller.getUsers);
router.post("/announcement", auth, admin, controller.createAnnouncement);
router.delete("/announcement/:id", auth, admin, controller.deleteAnnouncement);

router.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();
    return res.json(announcements);
  } catch (error) {
    console.error("Public announcements error:", error);
    return res.status(500).json({ message: "Unable to load announcements" });
  }
});

module.exports = router;
