const paypalClient =
require("../config/paypal");


const paypal =
require("@paypal/checkout-server-sdk");


const Donation =
require("../models/Donation");





exports.createOrder =
async(req,res)=>{


try{


const {

amount

}=req.body;



const request =
new paypal.orders.OrdersCreateRequest();



request.prefer(
"return=representation"
);



request.requestBody({

intent:"CAPTURE",


purchase_units:[

{

amount:{

currency_code:"USD",

value:
(amount / 130)
.toFixed(2)

},


description:
"Angels Home Education Center Donation"

}

]

});





const order =
await paypalClient.execute(
request
);





await Donation.create({

amount,

paymentMethod:"PAYPAL",

status:"Pending",

transactionId:
order.result.id

});





res.json({

success:true,

orderID:
order.result.id

});


}


catch(error){


console.log(error);


res.status(500).json({

message:
"PayPal order creation failed"

});


}


};








exports.captureOrder =
async(req,res)=>{


try{


const {

orderID

}=req.body;



const request =
new paypal.orders.OrdersCaptureRequest(
orderID
);



request.requestBody({});



const capture =
await paypalClient.execute(
request
);




await Donation.findOneAndUpdate(

{

transactionId:
orderID

},

{

status:
"Completed"

}

);





res.json({

success:true,

capture:
capture.result

});


}


catch(error){


res.status(500).json({

message:
"Payment capture failed"

});


}


};