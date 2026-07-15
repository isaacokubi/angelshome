const mongoose=require("mongoose");

const schema=new mongoose.Schema({

schoolName:String,

motto:String,

principalMessage:String,

phone:String,

email:String,

address:String,

facebook:String,

youtube:String,

twitter:String,

logo:String,

mapEmbed:String

});

module.exports=
mongoose.model(
"SchoolSettings",
schema
);