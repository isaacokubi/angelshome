const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

router.get("/settings", settingsController.getPublicSettings);

router.get("/staff", (req, res) => {
  res.json([]);
});

router.get("/timeline", (req, res) => {
  res.json([]);
});

module.exports = router;
