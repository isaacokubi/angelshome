const axios = require("axios");
const Donation = require("../models/Donation");

const MPESA_BASE_URL = (process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke").replace(/\/$/, "");

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

function requireMpesaConfig() {
  const required = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
    "MPESA_CALLBACK_URL",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing M-Pesa configuration: ${missing.join(", ")}`);
}

async function getAccessToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, timeout: 15000 }
  );
  return response.data.access_token;
}

exports.stkPush = async (req, res) => {
  try {
    requireMpesaConfig();
    const { phone, amount, donorName, email, project } = req.body || {};
    const normalizedPhone = normalizePhone(phone);
    const numericAmount = Number(amount);

    if (!normalizedPhone) return res.status(400).json({ success: false, message: "Enter a valid Kenyan phone number" });
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Donation amount must be a positive whole number" });
    }

    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").substring(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
        Amount: numericAmount,
        PartyA: normalizedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: normalizedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: process.env.MPESA_ACCOUNT_REFERENCE || "AngelsHomeSchool",
        TransactionDesc: process.env.MPESA_TRANSACTION_DESC || "School Donation",
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
    );

    const result = response.data || {};
    await Donation.create({
      donorName: donorName?.trim() || "Anonymous",
      phone: normalizedPhone,
      email: email?.trim().toLowerCase() || undefined,
      amount: numericAmount,
      paymentMethod: "MPESA",
      project: project?.trim() || undefined,
      status: "Pending",
      checkoutRequestId: result.CheckoutRequestID || null,
      merchantRequestId: result.MerchantRequestID || null,
    });

    return res.status(200).json({
      success: true,
      message: "STK Push sent to your phone",
      data: result,
    });
  } catch (error) {
    console.error("M-Pesa STK error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Unable to initiate M-Pesa payment" });
  }
};

exports.mpesaCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const metadata = callback.CallbackMetadata?.Item || [];
    const getMetadata = (name) => metadata.find((item) => item.Name === name)?.Value;
    const success = Number(callback.ResultCode) === 0;

    await Donation.findOneAndUpdate(
      { checkoutRequestId: callback.CheckoutRequestID },
      {
        $set: {
          status: success ? "Completed" : "Failed",
          ...(getMetadata("MpesaReceiptNumber") ? { transactionId: String(getMetadata("MpesaReceiptNumber")) } : {}),
        },
      }
    );

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error:", error.message);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
};
