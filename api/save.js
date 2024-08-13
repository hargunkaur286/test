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

router.post('/', async (req, res) => {
  try {
    const { email, apiKey, brokerageId } = req.body;
    if (!email || !apiKey || !brokerageId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newIntegration = new IntegrationVariables({ email, apiKey, brokerageId });
    await newIntegration.save();
    res.status(201).json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
