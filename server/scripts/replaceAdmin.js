require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const required = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) throw new Error(`${name} is required`);
  return String(value).trim();
};

async function main() {
  const mongoUri = required("MONGO_URI");
  const newEmail = required("NEW_ADMIN_EMAIL").toLowerCase();
  const newPassword = required("NEW_ADMIN_PASSWORD");
  const newName = process.env.NEW_ADMIN_NAME?.trim() || "System Administrator";
  const oldEmail = (process.env.OLD_ADMIN_EMAIL || "izobrack3@gmail.com").trim().toLowerCase();

  if (newPassword.length < 12) throw new Error("NEW_ADMIN_PASSWORD must be at least 12 characters long");
  if (newEmail === oldEmail) throw new Error("NEW_ADMIN_EMAIL must be different from OLD_ADMIN_EMAIL");

  await mongoose.connect(mongoUri);
  try {
    const passwordHash = await User.hashPassword(newPassword);
    const existingNew = await User.findOne({ email: newEmail }).select("+passwordHash");

    if (!existingNew) {
      await User.create({
        name: newName,
        email: newEmail,
        passwordHash,
        role: "admin",
        isActive: true,
      });
      console.log(`Created new portal administrator: ${newEmail}`);
    } else {
      existingNew.name = newName;
      existingNew.passwordHash = passwordHash;
      existingNew.role = "admin";
      existingNew.isActive = true;
      await existingNew.save();
      console.log(`Updated existing portal administrator: ${newEmail}`);
    }

    // Verify against the same User model used by POST /api/auth/login.
    const replacement = await User.findOne({ email: newEmail }).select("+passwordHash");
    if (!replacement || replacement.role !== "admin" || !replacement.isActive || !(await replacement.verifyPassword(newPassword))) {
      throw new Error("Replacement administrator verification failed; old administrator was NOT deleted.");
    }

    const deleted = await User.deleteOne({ email: oldEmail });
    console.log(`Deleted old portal administrator ${oldEmail}: ${deleted.deletedCount === 1 ? "yes" : "not found"}`);
    console.log(`Administrator replacement completed successfully for ${newEmail}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`Administrator replacement failed: ${error.message}`);
  process.exitCode = 1;
});
