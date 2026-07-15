const mongoose = require("mongoose");


const donationSchema = new mongoose.Schema(

{

    donorName:{
        type:String,
        default:"Anonymous"
    },


    phone:{
        type:String,
        required:true
    },


    email:{
        type:String
    },


    amount:{
        type:Number,
        required:true
    },


    paymentMethod:{
        type:String,
        enum:[
            "MPESA",
            "PAYPAL"
        ],
        required:true
    },


    transactionId:{
        type:String,
        default:null
    },


    project:{
        type:String,
        default:"General Development"
    },


    status:{
        type:String,
        enum:[
            "Pending",
            "Completed",
            "Failed"
        ],
        default:"Pending"
    },


    createdAt:{
        type:Date,
        default:Date.now
    }


}


);



module.exports =
mongoose.model(
"Donation",
donationSchema
);