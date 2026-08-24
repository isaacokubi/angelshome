require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

const required = (name, aliases = []) => {
  for (const key of [name, ...aliases]) {
    const value = process.env[key];
    if (value && String(value).trim()) return String(value).trim();
  }
  throw new Error(`${name} is required`);
};

async function main() {
  // The application environment uses MONGO_URI. MONGODB_URI remains
  // supported for older local environments.
  const mongoUri = required("MONGO_URI", ["MONGODB_URI"]);
  const email = required("ADMIN_RESET_EMAIL").toLowerCase();
  const password = required("ADMIN_RESET_PASSWORD");

  if (password.length < 12) {
    throw new Error("ADMIN_RESET_PASSWORD must be at least 12 characters long");
  }

  await mongoose.connect(mongoUri);
  try {
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      throw new Error(`No administrator exists for ${email}. Create the administrator first, then run the reset again.`);
    }

    admin.password = await bcrypt.hash(password, 12);
    admin.role = "admin";
    await admin.save();

    console.log(`Administrator password reset successfully for ${admin.email}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`Admin password reset failed: ${error.message}`);
  process.exitCode = 1;
});
