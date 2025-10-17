
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

const db = getFirestore();

export const generateApiKey = async (req, res) => {
  const { userId, expiresInDays } = req.body; // Expect userId from the admin's request

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required to generate an API key.' });
  }

  const apiKey = uuidv4();
  const apiKeyRef = db.collection('apiKeys').doc(apiKey);

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  try {
    await apiKeyRef.set({
      userId, // The ID of the user for whom the key is generated
      createdAt,
      expiresAt,
      isActive: true,
      usageCount: 0,
    });

    res.status(201).json({ 
      apiKey, 
      userId, 
      expiresAt: expiresAt.toISOString() 
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ message: 'Could not generate API key.' });
  }
};
