const mongoose=require("mongoose");

const schema=new mongoose.Schema({

name:{
type:String,
required:true
},

position:String,

qualification:String,

bio:String,

photo:String,

department:String,

email:String,

phone:String,

createdAt:{
type:Date,
default:Date.now
}

});

module.exports=
mongoose.model(
"Staff",
schema
);