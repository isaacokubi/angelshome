const mongoose=require("mongoose");

const schema=new mongoose.Schema({

title:String,

subtitle:String,

image:String,

buttonText:String,

buttonLink:String,

active:{
type:Boolean,
default:true
},

order:{
type:Number,
default:1
}

});

module.exports=
mongoose.model(
"HeroSlide",
schema
);