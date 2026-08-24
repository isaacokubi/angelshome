require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

const required = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required`);
  }
  return String(value).trim();
};

async function main() {
  const mongoUri = required("MONGODB_URI");
  const email = required("ADMIN_RESET_EMAIL").toLowerCase();
  const password = required("ADMIN_RESET_PASSWORD");

  if (password.length < 12) {
    throw new Error("ADMIN_RESET_PASSWORD must be at least 12 characters long");
  }

  await mongoose.connect(mongoUri);
  try {
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      throw new Error(`No administrator exists for ${email}`);
    }

    admin.password = await bcrypt.hash(password, 12);
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
