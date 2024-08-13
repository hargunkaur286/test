import express from 'express';
import axios from 'axios';
import app from '../server';

const router = express.Router();

const CLIENT_ID = process.env.NYLAS_CLIENT_ID;
const CLIENT_SECRET = process.env.NYLAS_SECRET;
const REDIRECT_URI = `${process.env.BASE_CLIENT_URL}/apps/email`;

router.get('/', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Authorization code not found.');
  }

  try {
    const tokenResponse = await axios.post('https://api.us.nylas.com/v3/connect/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;
    const grantId = tokenResponse.data.grant_id;
    
    const emailsResponse = await axios.get(`https://api.us.nylas.com/v3/grants/${grantId}/messages?limit=20`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    res.json(emailsResponse.data);
  } catch (error) {
    console.error('Error exchanging code for access token:', error);
    res.status(500).send('Failed to exchange code for access token.');
  }
});

export default router;
