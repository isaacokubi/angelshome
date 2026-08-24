const paypalClient = require("../config/paypal");
const paypal = require("@paypal/checkout-server-sdk");
const Donation = require("../models/Donation");

function requirePayPalConfig() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    throw new Error("PayPal credentials are not configured");
  }
}

function clientUrl() {
  const url = process.env.CLIENT_URL;
  if (!url) throw new Error("CLIENT_URL is not configured");
  return url.replace(/\/$/, "");
}

exports.createOrder = async (req, res) => {
  try {
    requirePayPalConfig();
    const { amount, donorName, phone, email, project } = req.body || {};
    const numericAmount = Number(amount);
    const usdRate = Number(process.env.USD_KES_RATE);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "A valid donation amount is required" });
    }
    if (!Number.isFinite(usdRate) || usdRate <= 0) {
      return res.status(500).json({ success: false, message: "USD/KES conversion rate is not configured" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: (numericAmount / usdRate).toFixed(2) },
        description: process.env.PAYPAL_DONATION_DESCRIPTION || "Angels Home Education Center Donation",
      }],
      application_context: {
        brand_name: process.env.PAYPAL_BRAND_NAME || "Angels Home Education Center",
        user_action: "PAY_NOW",
        return_url: `${clientUrl()}/donations?paypal=success`,
        cancel_url: `${clientUrl()}/donations?paypal=cancel`,
      },
    });

    const order = await paypalClient.execute(request);
    const orderId = order.result.id;
    const approvalLink = order.result.links?.find((link) => link.rel === "approve")?.href;
    if (!approvalLink) throw new Error("PayPal approval link was not returned");

    await Donation.create({
      donorName: donorName?.trim() || "Anonymous",
      phone: phone?.trim() || "Not provided",
      email: email?.trim().toLowerCase() || undefined,
      amount: numericAmount,
      paymentMethod: "PAYPAL",
      status: "Pending",
      transactionId: orderId,
      project: project?.trim() || undefined,
    });

    return res.json({ success: true, orderID: orderId, approvalUrl: approvalLink });
  } catch (error) {
    console.error("PayPal order creation error:", error.response?.details || error.message);
    return res.status(500).json({ success: false, message: "PayPal order creation failed" });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    requirePayPalConfig();
    const orderID = String(req.body?.orderID || "").trim();
    if (!orderID) return res.status(400).json({ success: false, message: "PayPal order ID is required" });

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await paypalClient.execute(request);
    const captureStatus = capture.result?.status;

    await Donation.findOneAndUpdate(
      { transactionId: orderID, paymentMethod: "PAYPAL" },
      { $set: { status: captureStatus === "COMPLETED" ? "Completed" : "Failed" } }
    );

    return res.json({ success: captureStatus === "COMPLETED", capture: capture.result });
  } catch (error) {
    console.error("PayPal capture error:", error.response?.details || error.message);
    return res.status(500).json({ success: false, message: "Payment capture failed" });
  }
};
