const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generateAccessToken, getTimestamp } = require('../utils/mpesa');

const shortCode = process.env.BUSINESS_SHORT_CODE;
const passKey = process.env.PASS_KEY;

router.get('/:checkoutRequestId', async (req, res) => {
  const { checkoutRequestId } = req.params;
  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'Missing checkoutRequestId' });
  }
  try {
    const accessToken = await generateAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');

    const queryPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      queryPayload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Transaction status error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Transaction status check failed', details: err.response?.data || err.message });
  }
});

module.exports = router;
