import axios from "axios";
import "dotenv/config";
import { getTimestamp } from "../utils/utils.timestamp.js";
import { firestore } from "../firebase.js";

const db = firestore;

const generatePassword = (shortCode, passkey, timestamp) => {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
};

export const initiateSTKPush = async (req, res) => {
  const { PASS_KEY, CALLBACK_URL } = process.env;
  const { amount, phoneNumber, accountId } = req.body;
  const { userId } = req;

  if (!amount || !phoneNumber || !accountId) {
    return res
      .status(400)
      .json({
        message: "Missing required fields: amount, phoneNumber, and accountId",
      });
  }

  try {
    const accountRef = db
      .collection("users")
      .doc(userId)
      .collection("accounts")
      .doc(accountId);
    const accountDoc = await accountRef.get();

    if (!accountDoc.exists) {
      return res.status(404).json({ message: "Account not found" });
    }

    const accountData = accountDoc.data();
    const { businessShortCode, tillNumber, paymentMethod, accountNumber } =
      accountData;

    const safaricomAccessToken = req.safaricom_access_token;
    const timestamp = getTimestamp();
    const password = generatePassword(businessShortCode, PASS_KEY, timestamp);

    const transactionType =
      paymentMethod === "paybill"
        ? "CustomerPayBillOnline"
        : "CustomerBuyGoodsOnline";
    const partyB = paymentMethod === "paybill" ? businessShortCode : tillNumber;

    const callbackUrlWithUserId = `${CALLBACK_URL}/api/transactions/mpesaCallback/${userId}`;

    const requestData = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: partyB,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrlWithUserId,
      AccountReference: accountNumber || "N/A",
      TransactionDesc: `Payment for ${accountNumber || "N/A"}`,
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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
