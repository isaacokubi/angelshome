const express = require("express");
const User = require("../models/User");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");

const router = express.Router();

// Returns active pupil accounts that are not present in any parent's children list.
// This intentionally uses the parent relationship as the source of truth instead
// of guessing from phone numbers, so administrators can identify incorrect links.
router.get("/unlinked-pupils", requireSchoolAuth, requireSchoolRole("admin"), async (req, res, next) => {
  try {
    const [pupils, parents] = await Promise.all([
      User.find({ role: "pupil", isActive: true })
        .select("name email phone parentPhone createdAt")
        .sort({ name: 1 })
        .lean(),
      User.find({ role: "parent", isActive: true })
        .select("children")
        .lean(),
    ]);

    const linkedPupilIds = new Set(
      parents.flatMap((parent) => Array.isArray(parent.children) ? parent.children.map((id) => id.toString()) : []),
    );

    const unlinkedPupils = pupils
      .filter((pupil) => !linkedPupilIds.has(pupil._id.toString()))
      .map((pupil) => ({
        ...pupil,
        hasParentPhone: Boolean(pupil.parentPhone || pupil.phone),
      }));

    return res.json({
      success: true,
      count: unlinkedPupils.length,
      pupils: unlinkedPupils,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
