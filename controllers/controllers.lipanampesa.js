import axios from 'axios';
import 'dotenv/config';
import { getTimestamp } from '../utils/utils.timestamp.js';

const generatePassword = (shortCode, passkey, timestamp) => {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
};

export const initiateSTKPush = async (req, res) => {
  const { BUSINESS_SHORT_CODE, PASS_KEY, CALLBACK_URL } = process.env;

  const { 
    PAYBILL_NO,
    TILL_NO,
    ACCOUNT_NO
  } = req.userConfig;

  const { 
    amount, 
    phone, 
    Order_ID,
    transactionType 
  } = req.body;

  if (!transactionType || (transactionType !== 'Paybill' && transactionType !== 'BuyGoods')) {
    return res.status(400).json({ message: "Invalid or missing 'transactionType'. Must be 'Paybill' or 'BuyGoods'." });
  }
  if (!amount || !phone) {
    return res.status(400).json({ message: "'amount' and 'phone' are required fields." });
  }

  const safaricomAccessToken = req.safaricom_access_token;
  const timestamp = getTimestamp();
  const password = generatePassword(BUSINESS_SHORT_CODE, PASS_KEY, timestamp);
  
  const accountReference = Order_ID || ACCOUNT_NO || 'N/A';
  const transactionDesc = `Payment for ${accountReference}`;
  
  const callbackUrl = `${CALLBACK_URL}/api/transactions/mpesaCallback/${accountReference}`;

  let requestData;

  if (transactionType === 'Paybill') {
    requestData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: PAYBILL_NO || BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };
  } else {
    if (!TILL_NO) {
        return res.status(400).json({ message: "'TILL_NO' is not configured for this API key to perform a 'BuyGoods' transaction." });
    }
    requestData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: TILL_NO,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };
  }

  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      requestData,
      {
        headers: {
          Authorization: `Bearer ${safaricomAccessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = error.response ? error.response.data : error.message;
    console.error('Error initiating STK push:', errorMessage);
    res.status(error.response?.status || 503).json({
      message: 'Error with the STK push.',
      error: errorMessage,
    });
  }
};
