const express = require("express");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const { getTimetableConfig, generateTimetable, createTimetable, updateTimetable, deleteTimetable, listTimetable } = require("../controllers/smisTimetableGenerationControllerV2");
const { listScopedTimetable } = require("../controllers/scopedTimetableController");

const router = express.Router();
const adminOnly = requireSchoolRole("admin");

router.get("/", requireSchoolAuth, listScopedTimetable);
router.get("/config", requireSchoolAuth, adminOnly, getTimetableConfig);
router.post("/generate", requireSchoolAuth, adminOnly, generateTimetable);
router.post("/", requireSchoolAuth, adminOnly, createTimetable);
router.patch("/:id", requireSchoolAuth, adminOnly, updateTimetable);
router.delete("/:id", requireSchoolAuth, adminOnly, deleteTimetable);

module.exports = router;
