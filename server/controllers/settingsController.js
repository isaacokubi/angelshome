const SchoolSettings = require("../models/SchoolSettings");

const DEFAULT_KEY = "primary";

function deepMerge(base, value) {
  if (Array.isArray(base)) return Array.isArray(value) && value.length ? value : base;
  if (base && typeof base === "object") return Object.fromEntries(Object.keys(base).map((key) => [key, deepMerge(base[key], value?.[key])]));
  return value ?? base;
}

function normalizeSettings(raw) {
  const defaults = new SchoolSettings({ key: DEFAULT_KEY }).toObject();
  const legacy = raw || {};
  const mapped = {
    school: {
      name: legacy.school?.name || legacy.schoolName,
      motto: legacy.school?.motto || legacy.motto,
      description: legacy.school?.description,
      logo: legacy.school?.logo || legacy.logo,
    },
    contact: {
      phone: legacy.contact?.phone || legacy.phone,
      email: legacy.contact?.email || legacy.email,
      address: legacy.contact?.address || legacy.address,
      mapEmbed: legacy.contact?.mapEmbed || legacy.mapEmbed,
    },
    social: {
      facebook: legacy.social?.facebook || legacy.facebook,
      youtube: legacy.social?.youtube || legacy.youtube,
      twitter: legacy.social?.twitter || legacy.twitter,
    },
    ...legacy,
  };
  delete mapped._id;
  delete mapped.__v;
  return deepMerge(defaults, mapped);
}

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
  return normalizeSettings(settings);
}

function sanitizeSettings(input = {}) {
  const allowed = ["school", "contact", "social", "homepage", "about", "academics", "support", "footer"];
  return Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
}

exports.getPublicSettings = async (req, res) => {
  try {
    return res.json({ success: true, data: await getOrCreateSettings() });
  } catch (error) {
    console.error("Public school settings error:", error);
    return res.status(500).json({ success: false, message: "Unable to load school settings" });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    return res.json({ success: true, data: await getOrCreateSettings() });
  } catch (error) {
    console.error("Admin school settings error:", error);
    return res.status(500).json({ success: false, message: "Unable to load school settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const update = sanitizeSettings(req.body);
    await getOrCreateSettings();
    const settings = await SchoolSettings.findOneAndUpdate({ key: DEFAULT_KEY }, { $set: update }, { new: true, runValidators: true }).lean();
    return res.json({ success: true, message: "School settings updated successfully", data: normalizeSettings(settings) });
  } catch (error) {
    console.error("Update school settings error:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to update school settings" });
  }
};
