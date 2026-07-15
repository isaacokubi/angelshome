const express = require("express");

const router = express.Router();


const {

stkPush,

mpesaCallback

}=require("../controllers/mpesaController");


const axios = require("axios");


// //router.post("/stkpush", async (req, res) => {
//   //try {
//     //const { phone, amount } = req.body;

//     const response = await axios.post(
//       //"https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
//       //{
//         //BusinessShortCode: process.env.MPESA_SHORTCODE,
//         //Password: password,
//         //Timestamp: timestamp,
//        // TransactionType: "CustomerPayBillOnline",
//        // Amount: amount,
//        // PartyA: phone,
//        // PartyB: process.env.MPESA_SHORTCODE,
//        // PhoneNumber: phone,
//        // CallBackURL: process.env.MPESA_CALLBACK_URL,
//        // AccountReference: "Angels Home",
//        // TransactionDesc: "Donation"
//       //},
//      // {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       }
//     );

//     res.json(response.data);
//   } catch (error) {
//     console.error(error.response?.data || error);
//     res.status(500).json({
//       message: "STK Push failed"
//     });
//   }
// });


router.post(
"/stkpush",
stkPush
);



router.post(
"/callback",
mpesaCallback
);



module.exports = router;