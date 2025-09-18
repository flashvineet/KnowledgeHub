const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { authMiddleware } = require('../middleware/auth');
const aiService = require('../services/aiService');
const { cosineSimilarity } = require('../utils/similarity');

// Handle both GET and POST
router.all('/', authMiddleware, async (req, res, next) => {
  try {
    const method = req.method.toUpperCase();
    const query = method === 'GET' ? req.query.query : req.body.query;
    const mode = method === 'GET' ? (req.query.mode || 'text') : (req.body.mode || 'semantic');
    const topK = method === 'GET' ? parseInt(req.query.topK || '5') : (req.body.topK || 5);

    if (!query) return res.json({ results: [] });

    // text search first
    const textResults = await Document.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { summary: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    }).limit(50).populate('createdBy', 'name email');

    if (mode === 'text') {
      return res.json({ results: textResults });
    }

    // semantic search
    const qEmbedding = await aiService.embed(query);
    const docsWithEmb = await Document.find({ embedding: { $exists: true, $ne: null } }).populate('createdBy', 'name email');

    if (!docsWithEmb.length) {
      return res.json({ results: textResults });
    }

    const scored = docsWithEmb.map(d => ({
      doc: d,
      score: cosineSimilarity(qEmbedding, d.embedding || [])
    })).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, topK).map(s => ({ ...s.doc.toObject(), relevance: s.score }));
    res.json({ results: top, fallbackTextMatches: textResults.slice(0, topK) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
