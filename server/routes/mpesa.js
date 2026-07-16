const express = require("express");

const router = express.Router();


const {

stkPush,

mpesaCallback

}=require("../controllers/mpesaController");


const axios = require("axios");



router.post(
"/stkpush",
stkPush
);



router.post(
"/callback",
mpesaCallback
);



module.exports = router;