require("dotenv").config();
const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const connectDatabase=require("../config/database");
const User=require("../models/User");
const SchoolClass=require("../models/SchoolClass");
const Subject=require("../models/Subject");
const LearningContent=require("../models/LearningContent");
const Exam=require("../models/Exam");
const ExamResult=require("../models/ExamResult");
const Attendance=require("../models/Attendance");
const Timetable=require("../models/Timetable");
const LibraryBook=require("../models/LibraryBook");

const YEAR="2026"; const TERM="Term 1"; const password="ChangeMe123!";
const names=(prefix,n)=>Array.from({length:n},(_,i)=>`${prefix} ${String(i+1).padStart(2,"0")}`);
const subjects=["Mathematics","English","Kiswahili","Integrated Science","Social Studies","Computer Studies","Creative Arts","Physical Education","Agriculture","Life Skills"];
const classNames=["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];
const books=[
["Primary Mathematics Skills","J. Kamau","Mathematics"],["English Grammar and Composition","A. Wanjiku","English"],["Kiswahili Lugha na Sarufi","M. Otieno","Kiswahili"],["Integrated Science Essentials","P. Mwangi","Integrated Science"],["Social Studies Today","R. Njeri","Social Studies"],["Computer Studies for Schools","D. Kiptoo","Computer Studies"],["Creative Arts Handbook","S. Achieng","Creative Arts"],["Physical Education Guide","K. Mutua","Physical Education"],["Modern Agriculture Basics","E. Chebet","Agriculture"],["Life Skills for Young Learners","F. Hassan","Life Skills"]
];

async function upsertUser({name,email,role,phone,classId=null,requestedClassId=null,classStatus="none",children=[]}){
 const existing=await User.findOne({email});
 if(existing){ if(classId&&(!existing.classId||String(existing.classId)!==String(classId))) {existing.classId=classId;existing.classStatus="confirmed";} if(children.length) existing.children=children; await existing.save(); return existing; }
 const passwordHash=await bcrypt.hash(password,12);
 return User.create({name,email,role,phone,passwordHash,classId,requestedClassId,classStatus,children,isActive:true});
}

async function run(){
 await connectDatabase();
 const [teacherDocs,parentDocs]=await Promise.all([Promise.all(names("Teacher",10).map((name,i)=>upsertUser({name,email:`teacher${i+1}@angelshome.test`,role:"teacher",phone:`+254700000${String(i+1).padStart(3,"0")}`}))),Promise.all(names("Parent",10).map((name,i)=>upsertUser({name,email:`parent${i+1}@angelshome.test`,role:"parent",phone:`+254710000${String(i+1).padStart(3,"0")}`})))]);
 const admin=await upsertUser({name:"System Administrator",email:"admin@angelshome.test",role:"admin",phone:"+254720000001"});
 const pupilDocs=[];
 for(let i=0;i<10;i++) pupilDocs.push(await upsertUser({name:`Pupil ${String(i+1).padStart(2,"0")}`,email:`pupil${i+1}@angelshome.test`,role:"pupil",phone:`+254730000${String(i+1).padStart(3,"0")}`}));
 const classDocs=[];
 for(let i=0;i<10;i++) classDocs.push(await SchoolClass.findOneAndUpdate({name:classNames[i],stream:"A",academicYear:YEAR},{name:classNames[i],stream:"A",academicYear:YEAR,capacity:40,classTeacher:teacherDocs[i]._id,isActive:true},{upsert:true,new:true,setDefaultsOnInsert:true}));
 for(let i=0;i<pupilDocs.length;i++){pupilDocs[i].classId=classDocs[i]._id;pupilDocs[i].classStatus="confirmed";pupilDocs[i].requestedClassId=null;await pupilDocs[i].save();parentDocs[i].children=[pupilDocs[i]._id];await parentDocs[i].save();}
 const subjectDocs=[];
 for(let i=0;i<subjects.length;i++) subjectDocs.push(await Subject.findOneAndUpdate({code:`SUB${String(i+1).padStart(2,"0")}`},{name:subjects[i],code:`SUB${String(i+1).padStart(2,"0")}`,description:`${subjects[i]} curriculum subject`,teachers:[teacherDocs[i]._id],isActive:true},{upsert:true,new:true,setDefaultsOnInsert:true}));
 const learningTypes=["lesson","homework","assignment","exam"];
 for(let i=0;i<10;i++){
  const type=learningTypes[i%4];
  await LearningContent.findOneAndUpdate({title:`Demo ${type} ${i+1}`,classId:classDocs[i]._id},{type,title:`Demo ${type} ${i+1}`,description:`Production workflow test content for ${classDocs[i].name}.`,classId:classDocs[i]._id,subject:subjects[i],teacher:teacherDocs[i]._id,dueDate:type!=="lesson"?new Date(Date.now()+86400000*(i+1)):null,startsAt:type==="lesson"?new Date():null,published:true},{upsert:true,new:true,setDefaultsOnInsert:true});
 }
 const examDocs=[];
 for(let i=0;i<10;i++) examDocs.push(await Exam.findOneAndUpdate({name:`Assessment ${i+1}`,term:TERM,academicYear:YEAR},{name:`Assessment ${i+1}`,type:i%2?"cat":"midterm",term:TERM,academicYear:YEAR,startDate:new Date(Date.now()-86400000),endDate:new Date(Date.now()+86400000),status:"published",createdBy:admin._id},{upsert:true,new:true,setDefaultsOnInsert:true}));
 for(let i=0;i<10;i++) await ExamResult.findOneAndUpdate({exam:examDocs[i]._id,pupil:pupilDocs[i]._id,subject:subjectDocs[i]._id},{exam:examDocs[i]._id,pupil:pupilDocs[i]._id,subject:subjectDocs[i]._id,marks:60+i,maxMarks:100,grade:i<2?"A":"B",teacherComment:"Seeded workflow record.",enteredBy:teacherDocs[i]._id},{upsert:true,new:true,setDefaultsOnInsert:true});
 for(let i=0;i<10;i++) await Attendance.findOneAndUpdate({pupil:pupilDocs[i]._id,date:new Date(new Date().setHours(0,0,0,0)-i*86400000)},{pupil:pupilDocs[i]._id,schoolClass:classDocs[i]._id,date:new Date(new Date().setHours(0,0,0,0)-i*86400000),status:["present","present","late","sick","absent"][i%5],note:"Seeded attendance workflow record.",recordedBy:teacherDocs[i]._id},{upsert:true,new:true,setDefaultsOnInsert:true});
 for(let i=0;i<10;i++) await Timetable.findOneAndUpdate({schoolClass:classDocs[i]._id,stream:"A",dayOfWeek:(i%5)+1,period:i+1,academicYear:YEAR,term:TERM},{schoolClass:classDocs[i]._id,stream:"A",subject:subjectDocs[i]._id,teacher:teacherDocs[i]._id,dayOfWeek:(i%5)+1,period:i+1,startTime:`0${8+i%2}:00`,endTime:`0${9+i%2}:00`,room:`Room ${i+1}`,academicYear:YEAR,term:TERM,isActive:true},{upsert:true,new:true,setDefaultsOnInsert:true});
 for(let i=0;i<10;i++){const [title,author,category]=books[i];await LibraryBook.findOneAndUpdate({isbn:`ANG-${YEAR}-${String(i+1).padStart(4,"0")}`},{title,author,isbn:`ANG-${YEAR}-${String(i+1).padStart(4,"0")}`,category,subject:category,publisher:"Angels Home Education Centre",year:Number(YEAR),location:`Shelf ${String.fromCharCode(65+i)}-01`,description:`School library learning resource for ${category}.`,totalCopies:5,availableCopies:5,isActive:true},{upsert:true,new:true,setDefaultsOnInsert:true});}
 console.log(JSON.stringify({success:true,seeded:{admins:1,teachers:teacherDocs.length,pupils:pupilDocs.length,parents:parentDocs.length,classes:classDocs.length,subjects:subjectDocs.length,learningContent:10,exams:examDocs.length,results:10,attendance:10,timetable:10,libraryBooks:10},testPassword:password},null,2));
 await mongoose.connection.close();
}
run().catch(async e=>{console.error(e);try{await mongoose.connection.close();}catch{}process.exit(1);});
