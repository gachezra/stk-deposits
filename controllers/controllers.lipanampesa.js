import axios from "axios";
import "dotenv/config";
import { getTimestamp } from "../utils/utils.timestamp.js";

const generatePassword = (shortCode, passkey, timestamp) => {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
};

export const initiateSTKPush = async (req, res) => {
  // Destructure transactionType from the request body
  const { amount, phone, Order_ID, transactionType } = req.body;

  if (!transactionType || (transactionType !== "Paybill" && transactionType !== "BuyGoods")) {
    return res.status(400).json({ message: "Invalid or missing 'transactionType'. Must be 'Paybill' or 'BuyGoods'." });
  }

  const safaricomAccessToken = req.safaricom_access_token;
  const timestamp = getTimestamp();
  const password = generatePassword(
    process.env.BUSINESS_SHORT_CODE,
    process.env.PASS_KEY,
    timestamp
  );
  const callbackUrl = `${process.env.CALLBACK_URL}/api/transactions/mpesaCallback/${Order_ID}`;

  let requestData;

  if (transactionType === "Paybill") {
    requestData = {
      BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.PAYBILL_NO,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: process.env.ACCOUNT_NO,
      TransactionDesc: `Payment for Order ${Order_ID}`,
    };
  } else {
    requestData = {
      BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.TILL_NO,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: Order_ID,
      TransactionDesc: `Payment for Order ${Order_ID}`,
    };
  }

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
    console.error("Error initiating STK push:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 503).json({
      message: "Error with the STK push.",
      error: error.response?.data || error.message,
    });
  }
};

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
    console.error("Error confirming payment:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 503).json({
      message: "Something went wrong while confirming the payment.",
      error: error.response?.data || error.message,
    });
  }
};

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
        console.error("Error initiating B2C transaction:", error.response ? error.response.data : error.message);
        res.status(error.response?.status || 503).json({
            message: "Something went wrong while trying to initiate B2C transaction.",
            error: error.response?.data || error.message,
        });
    }
};