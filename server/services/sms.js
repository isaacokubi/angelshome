const axios = require('axios');

function normalizePhone(phone) {
  const raw = String(phone || '').trim().replace(/[\s()-]/g, '');
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('00')) return `+${raw.slice(2)}`;
  if (raw.startsWith('0')) return `+254${raw.slice(1)}`;
  return `+${raw}`;
}

async function sendSms(to, message) {
  const phone = normalizePhone(to);
  if (!phone) throw new Error('A valid teacher phone number is required for SMS delivery.');

  const { AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY, AFRICASTALKING_SENDER_ID } = process.env;
  if (!AFRICASTALKING_USERNAME || !AFRICASTALKING_API_KEY) {
    throw new Error('SMS integration is not configured. Set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY.');
  }

  const body = new URLSearchParams({
    username: AFRICASTALKING_USERNAME,
    to: phone,
    message: String(message).slice(0, 480),
  });
  if (AFRICASTALKING_SENDER_ID) body.set('from', AFRICASTALKING_SENDER_ID);

  const response = await axios.post('https://api.africastalking.com/version1/messaging', body.toString(), {
    headers: {
      apiKey: AFRICASTALKING_API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });
  return response.data;
}

module.exports = { normalizePhone, sendSms };
