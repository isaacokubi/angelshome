require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const User = require("../models/User");

const EMAIL = "sponsor1@angelshome.test";
const PASSWORD = process.env.SPONSOR1_PASSWORD;

async function run() {
  if (!PASSWORD) {
    throw new Error("Set SPONSOR1_PASSWORD before running this targeted repair.");
  }

  await connectDatabase();
  try {
    const user = await User.findOne({ email: EMAIL }).select("+passwordHash email role isActive");
    if (!user) throw new Error(`${EMAIL} was not found.`);
    if (user.role !== "sponsor") throw new Error(`${EMAIL} is not a sponsor account.`);

    user.passwordHash = await User.hashPassword(PASSWORD);
    user.isActive = true;
    await user.save();

    console.log(JSON.stringify({
      success: true,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      message: "Sponsor test account password repaired without changing any other account."
    }, null, 2));
  } finally {
    await mongoose.connection.close();
  }
}

run().catch(async (error) => {
  console.error("Sponsor password repair failed:", error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
