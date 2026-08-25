const User = require("../models/User");

/**
 * Return active pupil accounts that are not referenced by any active parent's
 * `children` relationship. The relationship is the source of truth; phone
 * numbers are deliberately not used to infer a family link.
 */
const getUnlinkedPupils = async (req, res) => {
  try {
    const parents = await User.find({ role: "parent", isActive: true })
      .select("children")
      .lean();

    const linkedIds = parents.flatMap((parent) => Array.isArray(parent.children) ? parent.children : [])
      .map((id) => String(id));

    const pupils = await User.find({
      role: "pupil",
      isActive: true,
      ...(linkedIds.length ? { _id: { $nin: linkedIds } } : {}),
    })
      .select("name email phone createdAt profile")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: pupils.length,
      pupils,
    });
  } catch (error) {
    console.error("Unlinked pupils audit error:", error);
    return res.status(500).json({ success: false, message: "Unable to load unlinked pupil accounts" });
  }
};

module.exports = { getUnlinkedPupils };
