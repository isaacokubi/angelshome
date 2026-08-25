#!/usr/bin/env node
require("dotenv").config();

const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_ORIGINS"];
const recommended = ["JWT_EXPIRES_IN", "JSON_BODY_LIMIT", "SMS_PROVIDER", "SMS_API_KEY", "SMS_SENDER_ID"];

const missing = required.filter((key) => !String(process.env[key] || "").trim());
if (missing.length) {
  console.error(`Missing required production environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && String(process.env.JWT_SECRET).length < 32) {
  console.error("JWT_SECRET must contain at least 32 characters in production.");
  process.exit(1);
}

const absentRecommended = recommended.filter((key) => !String(process.env[key] || "").trim());
if (absentRecommended.length) {
  console.warn(`Recommended integrations/settings are not configured: ${absentRecommended.join(", ")}`);
}

console.log("Production environment verification passed.");
