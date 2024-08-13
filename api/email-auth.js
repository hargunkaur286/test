import express from 'express';
import app from '../server';

const router = express.Router();

const CLIENT_ID = process.env.NYLAS_CLIENT_ID;
const REDIRECT_URI = `${process.env.BASE_CLIENT_URL}/apps/email`;

router.get('/', (req, res) => {
  const authUrl = `https://api.us.nylas.com/v3/connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  res.json({ authUrl });
});

export default router;
