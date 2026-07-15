const rateLimit = require("express-rate-limit");

const mongoSanitize = require("express-mongo-sanitize");

const xss = require("xss-clean");





// Prevent too many requests

const limiter =
rateLimit({

windowMs:
15 * 60 * 1000,


max:
200,


message:
"Too many requests. Try again later."

});






module.exports = {


limiter,


mongoSanitize,


xss


};