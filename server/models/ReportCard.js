const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  pupil:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  exam:{type:mongoose.Schema.Types.ObjectId,ref:"Exam",required:true},
  contentHash:{type:String,required:true,index:true},
  generatedAt:{type:Date,default:Date.now},
  parentSignatureUrl:{type:String,default:""},
  parentSignedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  parentSignedAt:{type:Date,default:null},
  teacherSignatureUrl:{type:String,default:""},
  institutionSignatureUrl:{type:String,default:""},
  notificationStatus:{type:String,enum:["pending","sent","failed"],default:"pending"},
  notificationSentAt:{type:Date,default:null}
},{timestamps:true});
schema.index({pupil:1,exam:1},{unique:true});
module.exports=mongoose.model("ReportCard",schema);