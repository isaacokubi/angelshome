const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const makeLimiter = (max, message) => rateLimit({
  windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message },
  skip: (req) => req.path === "/health" || req.path === "/ready",
});
const limiter = makeLimiter(Number(process.env.GLOBAL_RATE_LIMIT || 200), "Too many requests. Try again later.");
const authLimiter = makeLimiter(Number(process.env.AUTH_RATE_LIMIT || 20), "Too many authentication attempts. Please try again later.");
const publicWriteLimiter = makeLimiter(Number(process.env.PUBLIC_WRITE_RATE_LIMIT || 30), "Too many submissions. Please try again later.");
const paymentLimiter = makeLimiter(Number(process.env.PAYMENT_RATE_LIMIT || 10), "Too many payment attempts. Please wait before trying again.");
module.exports = { limiter, authLimiter, publicWriteLimiter, paymentLimiter, mongoSanitize, xss };
