const axios = require('axios');
require('dotenv').config();

const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
const passKey = process.env.PASS_KEY;
const shortCode = process.env.BUSINESS_SHORT_CODE;

async function generateAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
  } catch (err) {
    console.error('Error generating access token:', err.response?.data || err.message);
    throw err;
  }
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n);
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function getPassword() {
  const timestamp = getTimestamp();
  return Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');
}

module.exports = {
  generateAccessToken,
  getTimestamp,
  getPassword
};
