import axios from "axios";

export const paymentCallback = async (req, res) => {
  const {
    Body: { stkCallback },
  } = req.body;

  const { userId } = req.params;

  if (!stkCallback) {
    return res.status(400).json({ message: "Invalid callback data" });
  }

  try {
    console.log("Received STK callback:", JSON.stringify(stkCallback, null, 2));
    res.status(200).json({ message: "Callback received successfully" });

    const result = await axios.post(
      `https://pay.pexmon.one/api/mpesa-callback/:${userId}`,
      stkCallback
    );

    if (result.status !== 200) console.error("Callback not sent!!");
  } catch (error) {
    console.error("Error handling payment callback:", error);
    res.status(500).json({ message: "Error processing callback" });
  }
};
