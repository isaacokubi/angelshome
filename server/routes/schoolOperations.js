const express = require("express");
const mongoose = require("mongoose");
const { requireSchoolAuth, requireSchoolRole } = require("../middleware/schoolAuth");
const AcademicYear = require("../models/AcademicYear");
const LessonPlan = require("../models/LessonPlan");
const FeeStructure = require("../models/FeeStructure");
const FeePayment = require("../models/FeePayment");
const InventoryItem = require("../models/InventoryItem");
const TransportRoute = require("../models/TransportRoute");
const MealPlan = require("../models/MealPlan");
const SchoolEvent = require("../models/SchoolEvent");

const router = express.Router();
const admin = requireSchoolRole("admin");
const staff = requireSchoolRole("admin", "teacher");
const valid = (v) => mongoose.Types.ObjectId.isValid(v);
const safeArray = (v) => Array.isArray(v) ? v.filter(Boolean).map(String) : [];

router.get("/academic-years", requireSchoolAuth, staff, async (req,res,next)=>{ try { res.json({success:true, academicYears:await AcademicYear.find({isActive:true}).sort({startDate:-1}).lean()}); } catch(e){next(e);} });
router.post("/academic-years", requireSchoolAuth, admin, async (req,res,next)=>{ try { const row=await AcademicYear.create(req.body); res.status(201).json({success:true,academicYear:row}); } catch(e){next(e);} });
router.patch("/academic-years/:id", requireSchoolAuth, admin, async (req,res,next)=>{ try { const row=await AcademicYear.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}); if(!row)return res.status(404).json({success:false,message:"Academic year not found"}); res.json({success:true,academicYear:row}); } catch(e){next(e);} });

router.get("/lessons", requireSchoolAuth, staff, async (req,res,next)=>{ try { const filter={}; if(valid(req.query.schoolClass))filter.schoolClass=req.query.schoolClass; if(valid(req.query.subject))filter.subject=req.query.subject; if(req.schoolUser.role==="teacher")filter.teacher=req.schoolUser._id; const rows=await LessonPlan.find(filter).populate("teacher","name").populate("schoolClass","name stream").populate("subject","name code").sort({lessonDate:-1,createdAt:-1}).limit(500).lean(); res.json({success:true,lessons:rows}); }catch(e){next(e);} });
router.post("/lessons", requireSchoolAuth, staff, async(req,res,next)=>{ try { const payload={...req.body,teacher:req.schoolUser.role==="teacher"?req.schoolUser._id:req.body.teacher}; if(!valid(payload.schoolClass)||!valid(payload.subject)||!valid(payload.teacher)||!payload.topic)return res.status(400).json({success:false,message:"Class, subject, teacher and topic are required"}); const row=await LessonPlan.create({teacher:payload.teacher,schoolClass:payload.schoolClass,subject:payload.subject,academicYear:payload.academicYear,term:payload.term,week:payload.week,topic:payload.topic,objectives:safeArray(payload.objectives),activities:safeArray(payload.activities),resources:safeArray(payload.resources),assessment:payload.assessment,lessonDate:payload.lessonDate,status:payload.status}); res.status(201).json({success:true,lesson:row}); }catch(e){next(e);} });
router.patch("/lessons/:id", requireSchoolAuth, staff, async(req,res,next)=>{ try { const filter={_id:req.params.id}; if(req.schoolUser.role==="teacher")filter.teacher=req.schoolUser._id; const row=await LessonPlan.findOneAndUpdate(filter,req.body,{new:true,runValidators:true}); if(!row)return res.status(404).json({success:false,message:"Lesson plan not found"}); res.json({success:true,lesson:row}); }catch(e){next(e);} });

router.get("/fees", requireSchoolAuth, admin, async(req,res,next)=>{ try { const structures=await FeeStructure.find({isActive:true}).populate("schoolClass","name stream").sort({academicYear:-1,term:1,name:1}).lean(); const payments=await FeePayment.aggregate([{ $match:{status:"completed"} },{$group:{_id:"$pupil",paid:{$sum:"$amount"}}}]); const paid=Object.fromEntries(payments.map(x=>[x._id.toString(),x.paid])); const pupils=await require("../models/User").find({role:"pupil",isActive:true}).select("name email").sort({name:1}).lean(); const totalExpected=structures.reduce((s,x)=>s+x.amount,0); res.json({success:true,structures,payments:payments.map(x=>({...x,pupil:x._id})),pupils,paidByPupil:paid,totalExpected}); }catch(e){next(e);} });
router.post("/fees", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await FeeStructure.create(req.body);res.status(201).json({success:true,feeStructure:row});}catch(e){next(e);}});
router.patch("/fees/:id", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await FeeStructure.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!row)return res.status(404).json({success:false,message:"Fee structure not found"});res.json({success:true,feeStructure:row});}catch(e){next(e);}});

router.get("/inventory", requireSchoolAuth, admin, async(req,res,next)=>{try{const rows=await InventoryItem.find({isActive:true}).sort({category:1,name:1}).lean();res.json({success:true,items:rows,lowStock:rows.filter(x=>x.quantity<=x.minimumStock)});}catch(e){next(e);}});
router.post("/inventory", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await InventoryItem.create(req.body);res.status(201).json({success:true,item:row});}catch(e){next(e);}});
router.patch("/inventory/:id", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await InventoryItem.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!row)return res.status(404).json({success:false,message:"Inventory item not found"});res.json({success:true,item:row});}catch(e){next(e);}});

router.get("/transport", requireSchoolAuth, admin, async(req,res,next)=>{try{const rows=await TransportRoute.find({isActive:true}).populate("vehicle","registrationNumber name").populate("driver","name phone").sort({name:1}).lean();res.json({success:true,routes:rows});}catch(e){next(e);}});
router.post("/transport", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await TransportRoute.create(req.body);res.status(201).json({success:true,route:row});}catch(e){next(e);}});
router.patch("/transport/:id", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await TransportRoute.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!row)return res.status(404).json({success:false,message:"Transport route not found"});res.json({success:true,route:row});}catch(e){next(e);}});

router.get("/meals", requireSchoolAuth, staff, async(req,res,next)=>{try{const rows=await MealPlan.find({}).sort({date:-1}).limit(180).lean();res.json({success:true,meals:rows});}catch(e){next(e);}});
router.post("/meals", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await MealPlan.findOneAndUpdate({date:new Date(req.body.date)},{...req.body,date:new Date(req.body.date)},{new:true,upsert:true,setDefaultsOnInsert:true,runValidators:true});res.status(201).json({success:true,meal:row});}catch(e){next(e);}});

router.get("/events", requireSchoolAuth, staff, async(req,res,next)=>{try{const rows=await SchoolEvent.find({}).populate("createdBy","name").sort({startAt:1}).limit(200).lean();res.json({success:true,events:rows});}catch(e){next(e);}});
router.post("/events", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await SchoolEvent.create({...req.body,createdBy:req.schoolUser._id});res.status(201).json({success:true,event:row});}catch(e){next(e);}});
router.patch("/events/:id", requireSchoolAuth, admin, async(req,res,next)=>{try{const row=await SchoolEvent.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!row)return res.status(404).json({success:false,message:"Event not found"});res.json({success:true,event:row});}catch(e){next(e);}});

module.exports=router;
