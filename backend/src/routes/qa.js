const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Document = require('../models/Document');
const aiService = require('../services/aiService');

// Simple Q&A using all docs as context
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });

    // fetch all docs from DB
    const docs = await Document.find();

    // ask Gemini with docs as context
    const answer = await aiService.askQuestion(question, docs);

    res.json({ answer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
