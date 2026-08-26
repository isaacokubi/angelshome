require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const User = require("../models/User");
const SchoolClass = require("../models/SchoolClass");
const AcademicYear = require("../models/AcademicYear");
const FeeStructure = require("../models/FeeStructure");
const FeePayment = require("../models/FeePayment");
const InventoryItem = require("../models/InventoryItem");
const TransportRoute = require("../models/TransportRoute");
const MealPlan = require("../models/MealPlan");
const SchoolEvent = require("../models/SchoolEvent");

const YEAR = "2026";
const TERM = "Term 1";
const todayUtc = () => {
  const parts = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
};
const day = (offset) => { const d = todayUtc(); d.setUTCDate(d.getUTCDate() + offset); return d; };

async function run() {
  await connectDatabase();
  const admin = await User.findOne({ role: "admin", isActive: true }).sort({ createdAt: 1 });
  const pupils = await User.find({ role: "pupil", isActive: true }).sort({ email: 1 }).limit(10);
  const classes = await SchoolClass.find({ academicYear: YEAR, isActive: true }).sort({ name: 1 }).limit(10);
  if (!admin || pupils.length < 10 || classes.length < 10) throw new Error("Expected an active admin, 10 pupils and 10 active classes before alignment.");

  await AcademicYear.findOneAndUpdate(
    { name: YEAR },
    { name: YEAR, startDate: new Date(`${YEAR}-01-01T00:00:00Z`), endDate: new Date(`${YEAR}-12-31T23:59:59Z`), isCurrent: true, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (let i = 0; i < classes.length; i += 1) {
    const schoolClass = classes[i];
    const amount = 12000 + i * 500;
    await FeeStructure.findOneAndUpdate(
      { name: `${schoolClass.name} Tuition`, term: TERM, academicYear: YEAR, schoolClass: schoolClass._id },
      { name: `${schoolClass.name} Tuition`, className: `${schoolClass.name}${schoolClass.stream ? ` / ${schoolClass.stream}` : ""}`, term: TERM, academicYear: YEAR, amount, tuition: amount, boarding: 0, activity: 500, other: 0, schoolClass: schoolClass._id, dueDate: new Date(`${YEAR}-04-30T23:59:59Z`), description: "Standard term fee structure.", isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const structures = await FeeStructure.find({ academicYear: YEAR, term: TERM, isActive: true }).sort({ createdAt: 1 }).limit(10).lean();
  for (let i = 0; i < pupils.length; i += 1) {
    const pupil = pupils[i];
    const structure = structures[i % structures.length];
    const reference = `ADM-${YEAR}-${String(i + 1).padStart(4, "0")}`;
    await FeePayment.findOneAndUpdate(
      { reference },
      { pupil: pupil._id, feeStructure: structure?._id || null, amount: 2500 + i * 250, paymentMethod: i % 2 === 0 ? "mpesa" : "cash", reference, term: TERM, academicYear: YEAR, status: "completed", receivedAt: new Date(), recordedBy: admin._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const inventory = [
    ["Exercise Books", "Stationery", 120, 30, "store-a", 80],
    ["Whiteboard Markers", "Stationery", 38, 10, "store-a", 120],
    ["Printer Paper", "Office", 24, 10, "admin-office", 650],
    ["Sports Cones", "Sports", 20, 5, "sports-room", 250],
    ["First Aid Kits", "Health", 8, 2, "staff-room", 1500],
  ];
  for (const [name, category, quantity, minimumStock, location, unitCost] of inventory) {
    await InventoryItem.findOneAndUpdate(
      { name },
      { name, category, quantity, unit: "item", minimumStock, location, supplier: "Angels Home Stores", unitCost, isActive: true, notes: "Operational alignment record." },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await TransportRoute.findOneAndUpdate(
    { name: "Nairobi Central Route" },
    { name: "Nairobi Central Route", pickupPoints: ["Town", "Ngara", "Pangani"], fee: 3500, departureTime: "06:30", returnTime: "16:00", isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (let i = 0; i < 5; i += 1) {
    const date = day(i);
    await MealPlan.findOneAndUpdate(
      { date },
      { date, breakfast: "Porridge and fruit", lunch: i % 2 ? "Rice, beans and vegetables" : "Ugali, beef and vegetables", snack: "Fruit", dinner: "Chapati and beans", notes: "School kitchen operational plan.", isPublished: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const events = [
    ["School opening briefing", 1, "Main hall"],
    ["Parents information meeting", 3, "Main hall"],
    ["Mid-term assessment review", 7, "Academic office"],
  ];
  for (const [title, offset, location] of events) {
    await SchoolEvent.findOneAndUpdate(
      { title },
      { title, description: `${title} for the ${YEAR} ${TERM} school calendar.`, startAt: new Date(day(offset).setUTCHours(7, 0, 0, 0)), endAt: new Date(day(offset).setUTCHours(16, 0, 0, 0)), location, audience: "all", isPublished: true, createdBy: admin._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const counts = {
    academicYears: await AcademicYear.countDocuments({ isActive: true }),
    feeStructures: await FeeStructure.countDocuments({ isActive: true }),
    completedPayments: await FeePayment.countDocuments({ status: "completed" }),
    inventoryItems: await InventoryItem.countDocuments({ isActive: true }),
    transportRoutes: await TransportRoute.countDocuments({ isActive: true }),
    mealPlans: await MealPlan.countDocuments({}),
    events: await SchoolEvent.countDocuments({ isPublished: true }),
  };
  console.log(JSON.stringify({ success: true, year: YEAR, term: TERM, counts, message: "Admin operations, finance, inventory, transport, meals and events aligned with live school records." }, null, 2));
  await mongoose.connection.close();
}

run().catch(async (error) => { console.error("Admin operations alignment failed:", error.message); try { await mongoose.connection.close(); } catch {} process.exit(1); });
