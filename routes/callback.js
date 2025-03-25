const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const callbackAuth = require('../middlewares/callbackAuth');

/**
 * Deposit Callback Endpoint
 * Safaricom's API POSTs to this URL after processing an STK push transaction.
 */
router.post('/deposit', callbackAuth, async (req, res) => {
  const callbackData = req.body;
  // Extract data from callback (update extraction logic as needed)
  const metadataItems = callbackData?.Body?.stkCallback?.CallbackMetadata?.Item || [];
  const phoneNumber = metadataItems.find(item => item.Name === 'PhoneNumber')?.Value;
  const transactionId = callbackData?.Body?.stkCallback?.CheckoutRequestID;
  const resultCode = callbackData?.Body?.stkCallback?.ResultCode;
  const resultDesc = callbackData?.Body?.stkCallback?.ResultDesc;
  const amountItem = metadataItems.find(item => item.Name === 'Amount');
  const amount = amountItem ? amountItem.Value : 0;
  
  if (phoneNumber && transactionId) {
    const status = resultCode === 0 ? 'completed' : 'failed';
    try {
      await Transaction.create({
        transactionId,
        phoneNumber,
        type: 'deposit',
        amount,
        status,
        description: resultDesc
      });
    } catch (err) {
      console.error('Error saving deposit callback transaction:', err);
    }
  }
  res.json({ message: 'Deposit callback received' });
});

/**
 * Withdrawal Callback Endpoint
 * Handles withdrawal callbacks. Adjust extraction based on the actual payload structure.
 */
router.post('/withdrawal', callbackAuth, async (req, res) => {
  const callbackData = req.body;
  // Example extraction logic; update as needed
  const phoneNumber = callbackData?.phoneNumber;
  const transactionId = callbackData?.transactionId;
  const status = callbackData?.status; // expected 'completed' or 'failed'
  const amount = callbackData?.amount;
  const description = callbackData?.description || '';
  
  if (phoneNumber && transactionId) {
    try {
      await Transaction.create({
        transactionId,
        phoneNumber,
        type: 'withdrawal',
        amount,
        status,
        description
      });
    } catch (err) {
      console.error('Error saving withdrawal callback transaction:', err);
    }
  }
  res.json({ message: 'Withdrawal callback received' });
});

module.exports = router;
