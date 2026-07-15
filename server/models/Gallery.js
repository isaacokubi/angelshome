const mongoose=require("mongoose");

const schema=new mongoose.Schema({

title:String,

image:String,

category:String,

uploadedAt:{

type:Date,

default:Date.now

}

});

module.exports=
mongoose.model(
"Gallery",
schema
);