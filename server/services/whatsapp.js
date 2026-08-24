const axios = require("axios");

async function sendWhatsAppText(to, body) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) throw new Error("WhatsApp integration is not configured");
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await axios.post(url, { messaging_product: "whatsapp", to, type: "text", text: { body } }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" }, timeout: 10000 });
  return response.data;
}
module.exports = { sendWhatsAppText };
