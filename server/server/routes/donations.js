const express = require("express");

const router = express.Router();


const Donation =
require("../models/Donation");





router.post("/", async(req,res)=>{


try{


const donation =
await Donation.create(

req.body

);



res.status(201).json({

success:true,

message:
"Donation record created",

donation

});


}


catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});







router.get("/", async(req,res)=>{


try{


const donations =
await Donation.find()
.sort({
createdAt:-1
});



res.json(donations);


}


catch(error){


res.status(500).json({

message:error.message

});


}


});





module.exports = router;