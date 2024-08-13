import express from 'express';
import mongoose from 'mongoose';
import app from '../server';

const router = express.Router();

// Define IntegrationVariables schema and model
const integrationVariablesSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true },
  apiKey: { type: String, required: true, trim: true },
  brokerageId: { type: String, required: true, trim: true }
});

const IntegrationVariables = mongoose.model('IntegrationVariables', integrationVariablesSchema);

router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const data = await IntegrationVariables.findOne({ email });

    if (!data) {
      return res.status(404).json({ error: 'No data found for this user' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
