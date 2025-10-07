import axios from "axios";
import "dotenv/config";
import { getTimestamp } from "../utils/utils.timestamp.js";

// Helper function for generating the M-Pesa password
const generatePassword = (shortCode, passkey, timestamp) => {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
};

/**
 * @desc   Initiate STK Push
 * @method POST
 * @route  /stkPush
 * @access Public
 */
export const initiateSTKPush = async (req, res) => {
  const { amount, phone, Order_ID } = req.body;
  console.log("Deets: ", req.body);
  const safaricomAccessToken = req.safaricom_access_token;
  const timestamp = getTimestamp();
  const password = generatePassword(
    process.env.BUSINESS_SHORT_CODE,
    process.env.PASS_KEY,
    timestamp
  );
  const callbackUrl = `${process.env.CALLBACK_URL}/api/transactions/mpesaCallback/${Order_ID}`;

  const requestData = {
    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: process.env.TILL_NO,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: "Account deposit",
    TransactionDesc: "Online depo",
  };

  try {
    const response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      requestData,
      {
        headers: {
          Authorization: `Bearer ${safaricomAccessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error initiating STK push:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response?.status || 503).json({
      message: "Error with the STK push.",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * @desc   Confirm M-Pesa Payment Status
 * @method POST
 * @route  /confirmPayment/:CheckoutRequestID
 * @access Public
 */
export const confirmPayment = async (req, res) => {
  const { CheckoutRequestID } = req.params;
  const safaricomAccessToken = req.safaricom_access_token;
  const timestamp = getTimestamp();
  const password = generatePassword(
    process.env.BUSINESS_SHORT_CODE,
    process.env.PASS_KEY,
    timestamp
  );

  const requestData = {
    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: CheckoutRequestID,
  };

  try {
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      requestData,
      {
        headers: {
          Authorization: `Bearer ${safaricomAccessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error confirming payment:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response?.status || 503).json({
      message: "Something went wrong while confirming the payment.",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * @desc   Initiate M-Pesa Business to Customer (B2C) transaction
 * @method POST
 * @route  /b2cTransaction/:userId
 * @access Public
 */
export const initiateB2CTransaction = async (req, res) => {
  const { amount, phone, remarks } = req.body;
  const { userId } = req.params;
  const safaricomAccessToken = req.safaricom_access_token;

  const requestData = {
    InitiatorName: process.env.INITIATOR_NAME,
    SecurityCredential: process.env.SECURITY_CREDENTIAL,
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: process.env.BUSINESS_SHORT_CODE,
    PartyB: phone,
    Remarks: remarks,
    QueueTimeOutURL: `${process.env.CALLBACK_BASE_URL}/api/transactions/b2cTimeout`,
    ResultURL: `${process.env.CALLBACK_BASE_URL}/api/transactions/mpesaCallback/${userId}`,
    Occasion: "Payment",
  };

  try {
    const response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      requestData,
      {
        headers: {
          Authorization: `Bearer ${safaricomAccessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error initiating B2C transaction:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response?.status || 503).json({
      message: "Something went wrong while trying to initiate B2C transaction.",
      error: error.response?.data || error.message,
    });
  }
};
