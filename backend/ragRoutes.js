import express from 'express';
import axios from 'axios';

const router = express.Router();
const RAG_URL = process.env.RAG_URL || 'http://localhost:8000';

//query
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const response = await axios.get(`${RAG_URL}/`, {
      params: { query: question },
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'RAG query failed', details: err.message });
  }
});

export default router;
