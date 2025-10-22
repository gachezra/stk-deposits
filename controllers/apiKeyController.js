import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

const db = getFirestore();
const secret = process.env.KEY_GENERATION_SECRET;

if (!secret) {
  throw new Error("API_KEY_SECRET is not set in environment variables.");
}

export const generateApiKey = async (req, res) => {
  const { userId, expiresInDays } = req.body;

  console.log("Deets: ", req.body);

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const userRef = db.collection("users").doc(userId);

    const salt = uuidv4();
    const payload = `${userId}.${salt}`;

    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const finalApiKey = `${Buffer.from(payload).toString(
      "base64"
    )}.${signature}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // FIX: Use .set() with { merge: true } to create the document if it doesn't exist,
    // or update it if it does. This prevents the "NOT_FOUND" error.
    await userRef.set(
      {
        apiKeySalt: salt,
        apiKeyExpiry: expiresAt,
      },
      { merge: true }
    );

    res.status(201).json({
      apiKey: finalApiKey,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error generating API key:", error);
    res.status(500).json({ message: "Could not generate API key." });
  }
};
