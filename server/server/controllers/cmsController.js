exports.getAll = Model => async (req,res)=>{

try{

const items=await Model.find();

res.json(items);

}

catch(error){

res.status(500).json({
message:error.message
});

}

};





exports.create = Model => async(req,res)=>{

try{

const item=
await Model.create(req.body);

res.status(201).json(item);

}

catch(error){

res.status(500).json({
message:error.message
});

}

};





exports.update = Model => async(req,res)=>{

try{

const item=
await Model.findByIdAndUpdate(

req.params.id,

req.body,

{new:true}

);

res.json(item);

}

catch(error){

res.status(500).json({
message:error.message
});

}

};






exports.remove = Model => async(req,res)=>{

try{

await Model.findByIdAndDelete(

req.params.id

);

res.json({

message:"Deleted"

});

}

catch(error){

res.status(500).json({

message:error.message

});

}

};