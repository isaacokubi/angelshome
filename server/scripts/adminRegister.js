require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function createAdmin() {
  try {
    const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("MONGO_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required");
    }
    if (ADMIN_PASSWORD.length < 10) {
      throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    }

    await mongoose.connect(MONGO_URI);
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await Admin.create({
      name: ADMIN_NAME.trim(),
      email,
      password,
      role: "admin",
    });

    console.log(`Admin ${admin.email} created successfully`);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
