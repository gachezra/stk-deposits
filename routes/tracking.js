const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

/**
 * Record a new transaction (deposit or withdrawal).
 * Endpoint: POST /tracking/:type where :type is "deposit" or "withdrawal"
 */
router.post('/:type', async (req, res) => {
  const { type } = req.params; // Expected: 'deposit' or 'withdrawal'
  const { phoneNumber, amount, status, transactionId, description } = req.body;

  if (!phoneNumber || !amount || !status || !transactionId) {
    return res.status(400).json({ error: 'Missing required fields: phoneNumber, amount, status, transactionId' });
  }
  if (!['deposit', 'withdrawal'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type. Must be deposit or withdrawal.' });
  }

  try {
    const transaction = new Transaction({
      transactionId,
      phoneNumber,
      type,
      amount,
      status,
      description: description || ''
    });
    await transaction.save();
    res.json({ message: `${type} recorded successfully`, transaction });
  } catch (err) {
    console.error('Error recording transaction:', err);
    res.status(500).json({ error: 'Error recording transaction', details: err.message });
  }
});

/**
 * Retrieve all transactions for a given phone number.
 * Endpoint: GET /tracking/:phoneNumber
 */
router.get('/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  try {
    const transactions = await Transaction.find({ phoneNumber });
    res.json({ transactions });
  } catch (err) {
    console.error('Error retrieving transactions:', err);
    res.status(500).json({ error: 'Error retrieving transactions', details: err.message });
  }
});

module.exports = router;
