const express = require("express");
const router = express.Router();

router.get("/staff", (req, res) => {
  res.json([]);
});

router.get("/timeline", (req, res) => {
  res.json([]);
});

module.exports = router;