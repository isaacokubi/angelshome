require("dotenv").config();


const express = require("express");

const cors = require("cors");

const helmet = require("helmet");

const morgan = require("morgan");

const adminRoutes = require("./routes/adminRoutes");


const connectDatabase =
require("./config/database");

const {

limiter,

mongoSanitize,

xss

}
=
require("./middleware/security");


const mpesaRoutes = require("./routes/mpesa");





const app = express();



connectDatabase();



// Security middleware

app.use(
helmet()
);



app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://angelshome.vercel.app",
    ],
    credentials: true,
  })
);



app.use(
express.json()
);


app.use(limiter);

app.use(mongoSanitize());

app.use(xss());


app.use(
morgan("dev")
);





// Routes

app.use(
"/api/contact",
require("./routes/contact")
);


app.use(
"/api/donations",
require("./routes/donations")
);


app.use(
"/api/mpesa",
require("./routes/mpesa")
);


app.use("/api/mpesa", mpesaRoutes);


app.use(
"/api/paypal",
require("./routes/paypal")
);


app.use(
"/api/admin",
require("./routes/admin")
);


app.use(
    "/api/admin",
    adminRoutes
);


app.use(
    "/api/cms",
    require("./routes/cms")
);





app.get("/",(req,res)=>{

res.json({

message:
"Angels Home Education Center API running"

});

});





const PORT =
process.env.PORT || 5000;



app.listen(PORT,()=>{


console.log(
`Server running on port ${PORT}`
);


});