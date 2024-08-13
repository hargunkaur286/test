import express from 'express';
import axios from 'axios';
import app from '../server';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.FINMO_TOKEN}`
    };

    const response = await axios.get(`https://app.finmo.ca/api/v1/applications?brokerageId=${process.env.FINMO_BROKERAGE_ID}`, {
      headers: headers
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Finmo API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
