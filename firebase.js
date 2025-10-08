
import admin from 'firebase-admin';

// Get the base64 encoded service account from the environment variable
const base64ServiceAccount = process.env.FIREBASE_SERVICE;

if (!base64ServiceAccount) {
  throw new Error('FIREBASE_SERVICE environment variable is not set.');
}

// Decode the base64 string to a JSON string
const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');

// Parse the JSON string to an object
const serviceAccount = JSON.parse(serviceAccountJson);

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Export the firestore database instance
const firestore = admin.firestore();

export { firestore };
