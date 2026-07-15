const mongoose=require("mongoose");

const schema=new mongoose.Schema({

className:String,

tuition:Number,

boarding:Number,

activity:Number,

other:Number

});

module.exports=
mongoose.model(
"FeeStructure",
schema
);