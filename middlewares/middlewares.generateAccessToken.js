
import axios from 'axios';
import 'dotenv/config';

const generateAccessToken = async () => {
  const consumer_key = process.env.MPESA_CONSUMER_KEY;
  const consumer_secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (err) {
    const error = new Error('Error generating access token');
    error.cause = err;
    throw error;
  }
};

export const accessToken = async (req, res, next) => {
  try {
    req.access_token = await generateAccessToken();
    next();
  } catch (error) {
    console.error('Access Token Middleware Error:', error.cause || error);
    res.status(500).json({ message: 'Could not generate access token.' });
  }
};
