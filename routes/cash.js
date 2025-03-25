const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generateAccessToken } = require('../utils/mpesa');

const shortCode = process.env.BUSINESS_SHORT_CODE;
const initiatorName = process.env.INITIATOR_NAME;
const securityCredential = process.env.SECURITY_CREDENTIAL;

router.post('/', async (req, res) => {
  const { phoneNumber, amount, remarks } = req.body;
  if (!phoneNumber || !amount || !remarks) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!initiatorName || !securityCredential) {
    return res.status(500).json({ error: 'Initiator credentials not set in environment variables' });
  }
  try {
    const accessToken = await generateAccessToken();
    const b2cPayload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: shortCode,
      PartyB: phoneNumber,
      Remarks: remarks,
      QueueTimeOutURL: "https://yourdomain.com/timeout", // Replace with your actual timeout URL
      ResultURL: "https://yourdomain.com/callback/withdraw",       // Replace with your actual result URL
      Occasion: "Payment"
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
      b2cPayload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Send cash error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Sending cash failed', details: err.response?.data || err.message });
  }
});

module.exports = router;
