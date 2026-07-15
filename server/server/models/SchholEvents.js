const mongoose=require("mongoose");

const schema=new mongoose.Schema({

title:String,

description:String,

date:Date,

type:String,

location:String

});

module.exports=
mongoose.model(
"Event",
schema
);