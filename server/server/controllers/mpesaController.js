const axios = require("axios");

const Donation = require("../models/Donation");



/*
Generate Safaricom OAuth Token
*/

async function getAccessToken() {

    const consumerKey =
        process.env.MPESA_CONSUMER_KEY;


    const consumerSecret =
        process.env.MPESA_CONSUMER_SECRET;



    const auth =
        Buffer.from(
            `${consumerKey}:${consumerSecret}`
        ).toString("base64");



    const response =
        await axios.get(

            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",

            {

                headers: {

                    Authorization:
                        `Basic ${auth}`

                }

            }

        );



    return response.data.access_token;

}





/*
Create STK Push
*/

exports.stkPush =
    async (req, res) => {


        try {


            const {

                phone,

                amount,

                donorName

            } = req.body;




            const token =
                await getAccessToken();




            const timestamp =
                new Date()
                    .toISOString()
                    .replace(/[-:.TZ]/g, "")
                    .substring(0, 14);




            const password =
                Buffer.from(

                    process.env.MPESA_SHORTCODE +

                    process.env.MPESA_PASSKEY +

                    timestamp

                ).toString("base64");







            const response =
                await axios.post(


                    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",


                    {


                        BusinessShortCode:
                            process.env.MPESA_SHORTCODE,


                        Password:
                            password,


                        Timestamp:
                            timestamp,


                        TransactionType:
                            "CustomerPayBillOnline",


                        Amount:
                            amount,


                        PartyA:
                            phone,


                        PartyB:
                            process.env.MPESA_SHORTCODE,


                        PhoneNumber:
                            phone,


                        CallBackURL:
                            process.env.MPESA_CALLBACK_URL,


                        AccountReference:
                            "AngelsHomeSchool",


                        TransactionDesc:
                            "School Donation"


                    },


                    {

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }


                );





            await Donation.create({

                donorName,

                phone,

                amount,

                paymentMethod: "MPESA",

                status: "Pending"

            });





            res.json({

                success: true,

                message:
                    "STK Push sent to your phone",

                data:
                    response.data

            });


        }


        catch (error) {


            console.log(
                error.response?.data || error.message
            );



            res.status(500).json({

                success: false,

                message:
                    "Unable to initiate M-PESA payment"

            });


        }


    };







/*
Safaricom Callback
*/

exports.mpesaCallback =
    async (req, res) => {


        try {


            const callback =
                req.body;




            console.log(
                "M-PESA CALLBACK:",
                JSON.stringify(callback, null, 2)
            );




            /*
            
            Here we extract:
            
            - Receipt Number
            - Transaction status
            
            from Safaricom response
            
            */


            res.json({

                ResultCode: 0,

                ResultDesc:
                    "Accepted"

            });


        }


        catch (error) {


            res.status(500).json({

                ResultCode: 1,

                ResultDesc:
                    "Failed"

            });


        }


    };