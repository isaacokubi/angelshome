const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  studentName:{type:String,required:true,trim:true,maxlength:150},
  dateOfBirth:{type:Date,required:true},
  requestedClass:{type:String,required:true,trim:true,maxlength:100},
  parentName:{type:String,required:true,trim:true,maxlength:150},
  parentPhone:{type:String,required:true,trim:true,maxlength:20},
  parentEmail:{type:String,trim:true,lowercase:true,maxlength:150},
  message:{type:String,trim:true,maxlength:2000,default:""},
  status:{type:String,enum:["pending","approved","rejected"],default:"pending",index:true},
  reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  reviewedAt:{type:Date,default:null},
  enrolledPupil:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}
},{timestamps:true});
schema.index({createdAt:-1});schema.index({parentPhone:1,status:1});
module.exports=mongoose.model("AdmissionApplication",schema);