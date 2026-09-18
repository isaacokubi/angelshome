const mongoose = require("mongoose");
const connectDatabase = async () => {
  const uri = String(process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();
  if (!uri) throw new Error("MONGO_URI/MONGODB_URI must be configured");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 15000),
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
    });
    console.log("MongoDB connected successfully");
  } catch (error) { console.error("Database connection failed:", error.message); throw error; }
};
module.exports = connectDatabase;
