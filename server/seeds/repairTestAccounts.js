require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDatabase = require("../config/database");
const User = require("../models/User");

const TEST_EMAIL_PATTERN = /@angelshome\.test$/i;
const TEST_PASSWORD = "ChangeMe123!";

async function run() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  const result = await User.updateMany(
    { email: { $regex: TEST_EMAIL_PATTERN }, isActive: true },
    { $set: { passwordHash } }
  );

  const accounts = await User.find({ email: { $regex: TEST_EMAIL_PATTERN } })
    .select("name email role isActive classId classStatus")
    .sort({ role: 1, email: 1 })
    .lean();

  console.log(JSON.stringify({
    success: true,
    matched: result.matchedCount,
    repaired: result.modifiedCount,
    accounts: accounts.map(({ name, email, role, isActive, classId, classStatus }) => ({
      name,
      email,
      role,
      isActive,
      classId: classId || null,
      classStatus: classStatus || "none",
    })),
    testPassword: TEST_PASSWORD,
    message: "Passwords repaired for active @angelshome.test test accounts only. Non-test accounts were not modified.",
  }, null, 2));

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error(`Test account repair failed: ${error.message}`);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
