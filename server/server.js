require("dotenv").config();
const express = require("express"); const cors = require("cors"); const helmet = require("helmet"); const morgan = require("morgan");
const connectDatabase = require("./config/database"); const { limiter, mongoSanitize, xss } = require("./middleware/security");
const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);
app.set("trust proxy", 1); app.disable("x-powered-by"); app.use(helmet());
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error("Origin not allowed by CORS")); }, credentials: true }));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" })); app.use(express.urlencoded({ extended: false, limit: process.env.JSON_BODY_LIMIT || "1mb" })); app.use(limiter); app.use(mongoSanitize()); app.use(xss()); app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.get("/", (req, res) => res.json({ success: true, message: "Angels Home Education Center API running", environment: process.env.NODE_ENV || "development" }));
app.get("/health", (req, res) => res.status(200).json({ success: true, status: "healthy" }));
app.use("/api/auth", require("./routes/auth")); app.use("/api/portal", require("./routes/portal")); app.use("/api/portal/attendance", require("./routes/portalAttendance")); app.use("/api/smis", require("./routes/smis")); app.use("/api/smis/timetable", require("./routes/smisTimetable")); app.use("/api/smis/operations", require("./routes/schoolOperations")); app.use("/api/finance", require("./routes/finance")); app.use("/api/reports", require("./routes/reports")); app.use("/api/notifications", require("./routes/notifications")); app.use("/api/whatsapp", require("./routes/whatsapp"));
app.use("/api/contact", require("./routes/contact")); app.use("/api/donations", require("./routes/donations")); app.use("/api/mpesa", require("./routes/mpesa")); app.use("/api/paypal", require("./routes/paypal")); app.use("/api/admin", require("./routes/admin")); app.use("/api/admin-audit", require("./routes/adminPupilAudit")); app.use("/api/cms", require("./routes/cms"));
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((error, req, res, next) => { if (error?.message === "Origin not allowed by CORS") return res.status(403).json({ success: false, message: "Origin not allowed" }); console.error("Unhandled server error:", error); return res.status(error?.status || 500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message }); });
const PORT = Number(process.env.PORT) || 5000;
async function start() { if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be configured"); if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be configured"); await connectDatabase(); app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); }
if (require.main === module) start().catch((error) => { console.error("Server startup failed:", error.message); process.exit(1); });
module.exports = app;
