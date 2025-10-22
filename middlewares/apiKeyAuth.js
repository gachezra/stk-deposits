import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";

const db = getFirestore();
const secret = process.env.KEY_GENERATION_SECRET;

export const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  console.log("Header: ", apiKey);

  if (!apiKey) {
    return res
      .status(401)
      .json({ message: "Unauthorized: API key is missing." });
  }

  try {
    const [encodedPayload, providedSignature] = apiKey.split(".");
    if (!encodedPayload || !providedSignature) {
      return res
        .status(403)
        .json({ message: "Forbidden: Invalid API key format." });
    }

    const payload = Buffer.from(encodedPayload, "base64").toString("ascii");
    const [userId, salt] = payload.split(".");
    if (!userId || !salt) {
      return res.status(403).json({ message: "Forbidden: Malformed API key." });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(403).json({ message: "Forbidden: Invalid API key." });
    }
    const userData = userDoc.data();

    if (!userData.apiKeyExpiry || userData.apiKeyExpiry.toDate() < new Date()) {
      return res
        .status(403)
        .json({ message: "Forbidden: API key has expired." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${userId}.${userData.apiKeySalt}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    );

    if (!isValid) {
      return res.status(403).json({ message: "Forbidden: Invalid API key." });
    }

    req.userConfig = userData;
    req.userId = userDoc.id;

    userRef.update({ usageCount: FieldValue.increment(1) });

    next();
  } catch (error) {
    console.error("Error in apiKeyAuth middleware:", error);
    res.status(500).json({ message: "Error validating API key." });
  }
};
