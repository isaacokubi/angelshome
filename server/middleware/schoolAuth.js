const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireSchoolAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "Account unavailable" });
    req.schoolUser = user;
    next();
  } catch { return res.status(401).json({ success: false, message: "Invalid or expired authentication token" }); }
}
const requireSchoolRole = (...roles) => (req, res, next) => roles.includes(req.schoolUser?.role) ? next() : res.status(403).json({ success: false, message: "Insufficient permissions" });
module.exports = { requireSchoolAuth, requireSchoolRole };
