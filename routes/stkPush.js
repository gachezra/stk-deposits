const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generateAccessToken, getTimestamp } = require('../utils/mpesa');

const shortCode = process.env.BUSINESS_SHORT_CODE;
const passKey = process.env.PASS_KEY;

router.post('/', async (req, res) => {
  const { phoneNumber, amount, accountReference, transactionDesc } = req.body;
  if (!phoneNumber || !amount || !accountReference || !transactionDesc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const accessToken = await generateAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "Alsidue Deposit",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: "https://yourdomain.com/callback/deposit",
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error('STK push error:', err.response?.data || err.message);
    res.status(500).json({ error: 'STK push failed', details: err.response?.data || err.message });
  }
});

module.exports = router;
