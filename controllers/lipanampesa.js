import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

const db = getFirestore();

export const mpesaCallback = async (req, res) => {
  const { Body: { stkCallback } } = req.body;

  if (!stkCallback) {
    return res.status(400).json({ message: 'Invalid callback data' });
  }

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

  const transactionRef = db.collection('transactions').doc(CheckoutRequestID);

  try {
    await transactionRef.set({
      merchantRequestID: MerchantRequestID,
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      callbackMetadata: CallbackMetadata,
      createdAt: new Date()
    });

    const userRef = db.collection('users').where('mpesaConfig.shortcode', '==', MerchantRequestID.slice(0, 6));
    const userSnapshot = await userRef.get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userConfig = userDoc.data();

      if (userConfig.mpesaConfig.webhookUrl) {
        await axios.post(userConfig.mpesaConfig.webhookUrl, stkCallback);
      }
    }

    res.status(200).json({ message: 'Callback received and processed' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ message: 'Error processing callback' });
  }
};
