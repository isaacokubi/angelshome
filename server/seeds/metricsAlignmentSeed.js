require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDatabase = require("../config/database");
const User = require("../models/User");
const Exam = require("../models/Exam");

const YEAR = "2026";
const TERM = "Term 1";
const PASSWORD = "ChangeMe123!";

async function run() {
  await connectDatabase();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const pupils = await User.find({ role: "pupil", isActive: true }).sort({ email: 1 }).limit(10).lean();
  if (pupils.length < 10) throw new Error(`Expected at least 10 active pupils, found ${pupils.length}.`);

  const sponsors = [];
  for (let i = 0; i < 10; i += 1) {
    const name = `Sponsor ${String(i + 1).padStart(2, "0")}`;
    const email = `sponsor${i + 1}@angelshome.test`;
    const sponsor = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        role: "sponsor",
        phone: `+254740000${String(i + 1).padStart(3, "0")}`,
        passwordHash,
        sponsoredPupils: [pupils[i % pupils.length]._id],
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    sponsors.push(sponsor);
  }

  const exams = await Exam.find({ academicYear: YEAR, term: TERM }).sort({ createdAt: 1 });
  if (!exams.length) throw new Error(`No ${YEAR} ${TERM} examinations were found.`);
  const opened = await Exam.updateMany(
    { academicYear: YEAR, term: TERM },
    { $set: { status: "open" } }
  );

  const openCount = await Exam.countDocuments({ academicYear: YEAR, term: TERM, status: "open" });
  const sponsorCount = await User.countDocuments({ role: "sponsor", isActive: true });

  console.log(JSON.stringify({
    success: true,
    sponsorsCreatedOrUpdated: sponsors.length,
    activeSponsors: sponsorCount,
    examinationsOpened: opened.modifiedCount,
    openExaminations: openCount,
    sponsorPupilLinks: sponsors.length,
    message: "Dashboard sponsor and open-examination metrics now align with the seeded school records.",
  }, null, 2));

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Metrics alignment seed failed:", error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
