const express=require("express");
const validator=require("validator");
const AdmissionApplication=require("../models/AdmissionApplication");
const User=require("../models/User");
const PupilProfile=require("../models/PupilProfile");
const SchoolClass=require("../models/SchoolClass");
const {requireSchoolAuth,requireSchoolRole}=require("../middleware/schoolAuth");
const {publicWriteLimiter,authLimiter}=require("../middleware/security");
const crypto=require("crypto");
const router=express.Router();
router.post("/",publicWriteLimiter,async(req,res,next)=>{try{
 const b=req.body||{}; const phone=String(b.parentPhone||"").trim().replace(/^0+/,"+254");
 if(!b.studentName||!b.dateOfBirth||!b.requestedClass||!b.parentName||!/^\+?2547\d{8}$/.test(phone)) return res.status(400).json({success:false,message:"Student, date of birth, requested class, parent name and a valid Kenyan +254 7XXXXXXXX phone are required."});
 if(b.parentEmail&&!validator.isEmail(String(b.parentEmail))) return res.status(400).json({success:false,message:"Enter a valid parent email address."});
 const row=await AdmissionApplication.create({studentName:String(b.studentName).trim(),dateOfBirth:b.dateOfBirth,requestedClass:String(b.requestedClass).trim(),parentName:String(b.parentName).trim(),parentPhone:phone,parentEmail:String(b.parentEmail||"").trim(),message:String(b.message||"").trim()});
 res.status(201).json({success:true,application:{id:row._id,status:row.status,message:"Admission application submitted successfully. The school will contact you."}});
}catch(e){next(e)}});
router.get("/",requireSchoolAuth,requireSchoolRole("admin"),async(req,res,next)=>{try{
 const filter={}; if(["pending","approved","rejected"].includes(req.query.status))filter.status=req.query.status;
 if(req.query.search){const q=String(req.query.search).trim();filter.$or=[{studentName:{$regex:q,$options:"i"}},{parentName:{$regex:q,$options:"i"}},{parentPhone:{$regex:q,$options:"i"}}];}
 const applications=await AdmissionApplication.find(filter).populate("reviewedBy","name").populate("enrolledPupil","name email").sort({createdAt:-1}).limit(300).lean();
 const counts=await AdmissionApplication.aggregate([{$group:{_id:"$status",count:{$sum:1}}}]);
 res.json({success:true,applications,statusCounts:Object.fromEntries(counts.map(x=>[x._id,x.count]))});
}catch(e){next(e)}});
router.patch("/:id/status",requireSchoolAuth,requireSchoolRole("admin"),authLimiter,async(req,res,next)=>{try{
 const status=String(req.body?.status||""); if(!["pending","approved","rejected"].includes(status))return res.status(400).json({success:false,message:"Invalid admission status."});
 const row=await AdmissionApplication.findById(req.params.id); if(!row)return res.status(404).json({success:false,message:"Admission application not found."});
 if(status==="approved"&&!row.enrolledPupil){
   const year=new Date().getFullYear(); const base=String(row.studentName).replace(/[^A-Za-z0-9]/g,"").slice(0,4).toUpperCase()||"PUPL"; const suffix=String(row._id).slice(-4).toUpperCase();
   let admission=base+"-"+year+"-"+suffix; let n=1; while(await PupilProfile.exists({admissionNumber:admission}))admission=base+"-"+year+"-"+suffix+"-"+n++;
   const email="pupil-"+String(row._id).slice(-8)+"@angels-home.local"; const passwordHash=await User.hashPassword(crypto.randomBytes(18).toString("base64url"));
   const pupil=await User.create({name:row.studentName,email,passwordHash,role:"pupil",isActive:true});
   const schoolClass=await SchoolClass.findOne({name:row.requestedClass,isActive:true}).sort({academicYear:-1});
   await PupilProfile.create({pupil:pupil._id,admissionNumber:admission,dateOfBirth:row.dateOfBirth,schoolClass:schoolClass?schoolClass._id:null,status:"active"});
   row.enrolledPupil=pupil._id;
 }
 row.status=status;row.reviewedBy=req.schoolUser._id;row.reviewedAt=new Date();await row.save();
 res.json({success:true,application:row.toObject(),message:status==="approved"?"Application approved and learner account created. Reset the learner credentials before portal access.":"Admission status updated."});
}catch(e){next(e)}});
module.exports=router;