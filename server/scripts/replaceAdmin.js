require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

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
    const existingNew = await Admin.findOne({ email: newEmail }).select("+password");
    if (!existingNew) {
      await Admin.create({
        name: newName,
        email: newEmail,
        password: await bcrypt.hash(newPassword, 12),
        role: "admin",
      });
      console.log(`Created new administrator: ${newEmail}`);
    } else {
      existingNew.name = newName;
      existingNew.password = await bcrypt.hash(newPassword, 12);
      existingNew.role = "admin";
      await existingNew.save();
      console.log(`Updated existing administrator: ${newEmail}`);
    }

    // Verify the replacement account before removing the old one.
    const replacement = await Admin.findOne({ email: newEmail }).select("+password");
    if (!replacement || !(await bcrypt.compare(newPassword, replacement.password))) {
      throw new Error("Replacement administrator verification failed; old administrator was NOT deleted.");
    }

    const deleted = await Admin.deleteOne({ email: oldEmail });
    console.log(`Deleted old administrator ${oldEmail}: ${deleted.deletedCount === 1 ? "yes" : "not found"}`);
    console.log(`Administrator replacement completed successfully for ${newEmail}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`Administrator replacement failed: ${error.message}`);
  process.exitCode = 1;
});
