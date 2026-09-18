#!/usr/bin/env node
require("dotenv").config();
const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_ORIGINS"];
const missing = required.filter((key) => !String(process.env[key] || "").trim());
if (missing.length) { console.error(`Missing required production environment variables: ${missing.join(", ")}`); process.exit(1); }
if (process.env.NODE_ENV === "production") {
  if (String(process.env.JWT_SECRET).length < 32) { console.error("JWT_SECRET must contain at least 32 characters in production."); process.exit(1); }
  if (/\*/.test(process.env.CLIENT_ORIGINS)) { console.error("CLIENT_ORIGINS must not contain wildcard origins in production."); process.exit(1); }
}
const cloudinary = ["CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET"];
const cloudMissing = cloudinary.filter((key) => !String(process.env[key] || "").trim());
if (cloudMissing.length && cloudMissing.length !== cloudinary.length) { console.error(`Cloudinary configuration is incomplete: ${cloudMissing.join(", ")}`); process.exit(1); }
const mpesa = ["MPESA_CONSUMER_KEY","MPESA_CONSUMER_SECRET","MPESA_SHORTCODE","MPESA_PASSKEY","MPESA_CALLBACK_URL"];
const mpesaMissing = mpesa.filter((key) => !String(process.env[key] || "").trim());
if (mpesaMissing.length && mpesaMissing.length !== mpesa.length) { console.error(`M-Pesa configuration is incomplete: ${mpesaMissing.join(", ")}`); process.exit(1); }
console.log("Production environment verification passed.");
