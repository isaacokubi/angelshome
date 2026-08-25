const SchoolSettings = require("../models/SchoolSettings");

const DEFAULT_KEY = "primary";

async function getOrCreateSettings() {
  let settings = await SchoolSettings.findOne({ key: DEFAULT_KEY }).lean();
  if (!settings) {
    const existing = await SchoolSettings.findOne({}).lean();
    if (existing) {
      await SchoolSettings.updateOne({ _id: existing._id }, { $set: { key: DEFAULT_KEY } });
      settings = await SchoolSettings.findById(existing._id).lean();
    } else {
      settings = await SchoolSettings.create({ key: DEFAULT_KEY });
      settings = settings.toObject();
    }
  }
  return settings;
}

function sanitizeSettings(input = {}) {
  const allowed = ["school", "contact", "social", "homepage", "about", "academics", "support", "footer"];
  return Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
}

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Public school settings error:", error);
    return res.status(500).json({ success: false, message: "Unable to load school settings" });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Admin school settings error:", error);
    return res.status(500).json({ success: false, message: "Unable to load school settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const update = sanitizeSettings(req.body);
    await getOrCreateSettings();
    const settings = await SchoolSettings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "School settings updated successfully", data: settings });
  } catch (error) {
    console.error("Update school settings error:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to update school settings" });
  }
};
