import axios from "axios";
import "dotenv/config";
import { getTimestamp } from "../utils/utils.timestamp.js";
import { firestore } from "../firebase.js";

const db = firestore;

const generatePassword = (shortCode, passkey, timestamp) => {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
};

export const initiateSTKPush = async (req, res) => {
  const { PASS_KEY, CALLBACK_URL, BUSINESS_SHORT_CODE } = process.env;
  const { amount, phoneNumber, accountId } = req.body;
  const { userId } = req;

  if (!amount || !phoneNumber || !accountId) {
    return res.status(400).json({
      message: "Missing required fields: amount, phoneNumber, and accountId",
    });
  }

  console.log("Deets: ", { userId, amount, phoneNumber, accountId });

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const accountData = userData.accounts?.find((acc) => acc.id === accountId);

    console.log("User deets: ", { userData });

    if (!accountData) {
      return res
        .status(404)
        .json({ message: "Account not found with the provided ID" });
    }

    let transactionType = "";
    let partyB = "";
    let accountReference = "";

    if (accountData.type === "till") {
      console.log("Account type is 'till'. Preparing 'Buy Goods' transaction.");
      if (!accountData.tillNumber) {
        return res.status(400).json({
          message: "Account is type 'till' but is missing a tillNumber.",
        });
      }

      transactionType = "CustomerBuyGoodsOnline";
      partyB = accountData.tillNumber;
      accountReference = accountData.name || "Till Payment";
    } else if (accountData.type === "business") {
      console.log(
        "Account type is 'business'. Preparing 'Paybill' transaction."
      );
      if (!accountData.businessShortCode) {
        return res.status(400).json({
          message:
            "Account is type 'business' but is missing a businessShortCode.",
        });
      }
      if (!accountData.accountNumber) {
        return res.status(400).json({
          message:
            "Account is type 'business' but is missing an accountNumber for the reference.",
        });
      }

      transactionType = "CustomerPayBillOnline";
      partyB = accountData.businessShortCode;
      accountReference = accountData.accountNumber;
    } else {
      return res
        .status(400)
        .json({ message: `Unsupported account type: '${accountData.type}'` });
    }

    const safaricomAccessToken = req.access_token;
    const timestamp = getTimestamp();
    const password = generatePassword(BUSINESS_SHORT_CODE, PASS_KEY, timestamp);
    const callbackUrlWithUserId = `${CALLBACK_URL}/api/transactions/mpesaCallback/${userId}`;

    const requestData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: partyB,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrlWithUserId,
      AccountReference: accountReference,
      TransactionDesc: `Payment for ${accountData.name || accountReference}`,
    };

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
    const errorMessage = error.response ? error.response.data : error.message;
    console.error("Error initiating STK push:", errorMessage);
    res.status(error.response?.status || 503).json({
      message: "Error with the STK push.",
      error: errorMessage,
    });
  }
};

export const mpesaCallback = async (req, res) => {
  const { userId } = req.params;
  const {
    Body: { stkCallback },
  } = req.body;

  console.log("Callback deets: ", Body);

  if (!stkCallback) {
    return res.status(400).json({ message: "Invalid callback data" });
  }

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = stkCallback;

  const transactionRef = db
    .collection("users")
    .doc(userId)
    .collection("transactions")
    .doc(CheckoutRequestID);

  try {
    await transactionRef.set({
      merchantRequestID: MerchantRequestID,
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      callbackMetadata: CallbackMetadata,
      createdAt: new Date(),
    });

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.webhookUrl) {
        await axios.post(userData.webhookUrl, stkCallback);
      }
    }

    res.status(200).json({ message: "Callback received and processed" });
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error);
    res.status(500).json({ message: "Error processing callback" });
  }
};

export const initiatePayment = async (req, res) => {
  const { PASS_KEY, CALLBACK_URL, BUSINESS_SHORT_CODE } = process.env;
  const { amount, phoneNumber } = req.body;

  if (!amount || !phoneNumber) {
    return res.status(400).json({
      message: "Missing required fields: amount and phoneNumber",
    });
  }

  try {
    const safaricomAccessToken = req.access_token;
    const timestamp = getTimestamp();
    const password = generatePassword(BUSINESS_SHORT_CODE, PASS_KEY, timestamp);

    const requestData = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${CALLBACK_URL}/api/transactions/paymentCallback`,
      AccountReference: "TestPayment",
      TransactionDesc: "Simple STK Push",
    };

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
    const errorMessage = error.response ? error.response.data : error.message;
    console.error("Error initiating simple STK push:", errorMessage);
    res.status(error.response?.status || 503).json({
      message: "Error with the STK push.",
      error: errorMessage,
    });
  }
};
