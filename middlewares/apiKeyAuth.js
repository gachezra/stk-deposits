
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ message: 'Unauthorized: API key is missing.' });
  }

  const apiKeyRef = db.collection('apiKeys').doc(apiKey);

  try {
    const doc = await apiKeyRef.get();

    if (!doc.exists) {
      return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
    }

    const keyData = doc.data();

    if (!keyData.isActive) {
      return res.status(403).json({ message: 'Forbidden: API key is inactive.' });
    }

    if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      return res.status(403).json({ message: 'Forbidden: API key has expired.' });
    }

    const userRef = db.collection('users').doc(keyData.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User configuration not found for this API key.' });
    }

    req.userConfig = userDoc.data();
    req.userId = keyData.userId; // Attach userId to the request

    apiKeyRef.update({ usageCount: (keyData.usageCount || 0) + 1 });

    next();
  } catch (error) {
    console.error('Error in apiKeyAuth middleware:', error);
    res.status(500).json({ message: 'Error validating API key.' });
  }
};
