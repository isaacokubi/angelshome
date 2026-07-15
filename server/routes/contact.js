const express = require("express");

const router = express.Router();


const Contact =
require("../models/Contact");





router.post("/", async(req,res)=>{


try{


const {

name,

email,

phone,

message


}=req.body;




const contact =
await Contact.create({

name,

email,

phone,

message

});



res.status(201).json({

success:true,

message:
"Message received successfully",

contact

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


const messages =
await Contact.find()
.sort({
createdAt:-1
});


res.json(messages);


}

catch(error){

res.status(500).json({

message:error.message

});

}


});




module.exports = router;