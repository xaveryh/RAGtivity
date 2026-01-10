import express from 'express';

const router = express.Router();
const RAG_URL = 'http://rag:8000';

//query
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });
    const response = await fetch(`${RAG_URL}/query`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({question: question, userId: req.cookies.userId})
    });
    const result = await response.json()
    return res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'RAG query failed', details: err.message });
  }
});

export default router;
