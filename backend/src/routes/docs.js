const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { authMiddleware, requireRole } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Create doc (auto-summary, tags, embedding)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    if(!title || !content) return res.status(400).json({ error: 'title and content required' });

    // create doc (without AI fields)
    const doc = new Document({ title, content, tags: tags || [], createdBy: req.user._id });
    await doc.save();

    // asynchronously call AI to summarize/tags/embedding and update doc
    try {
      const [summary, generatedTags, embedding] = await Promise.all([
        aiService.summarizeDoc(content),
        aiService.generateTagsDoc(content),
        //aiService.embed(content)
      ]);
      doc.summary = summary || doc.summary;
      if (generatedTags && generatedTags.length) {
        doc.tags = Array.from(new Set([...(doc.tags || []), ...generatedTags]));
      }
      if (embedding && embedding.length) doc.embedding = embedding;
      await doc.save();
    } catch (aiErr) {
      console.warn('AI step failed:', aiErr.message || aiErr);
    }

    res.status(201).json(doc);
  } catch (err) { next(err); }
});

// Read all (with filters, tag filter)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { tag, text, page = 1, limit = 20 } = req.query;
    const q = {};
    if (tag) q.tags = tag;
    if (text) q.$or = [
      { title: { $regex: text, $options: 'i' } },
      { content: { $regex: text, $options: 'i' } },
      { summary: { $regex: text, $options: 'i' } }
    ];

    const docs = await Document.find(q)
      .sort({ updatedAt: -1 })
      .skip((page-1)*limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');
    res.json(docs);
  } catch (err) { next(err); }
});

// Get single doc
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).populate('createdBy', 'name email');
    if(!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

// Update doc: user can update own; admin can update any
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Not found' });

    if (String(doc.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const allowed = ['title','content','tags'];
    allowed.forEach(k => { if (req.body[k] !== undefined) doc[k] = req.body[k]; });
    await doc.save();

    // re-generate summary/tags/embedding if content changed
    if (req.body.content) {
      try {
        const [summary, generatedTags, embedding] = await Promise.all([
          aiService.summarizeDoc(doc.content),
          aiService.generateTagsDoc(doc.content),
          //aiService.embed(doc.content)
        ]);
        if (summary) doc.summary = summary;
        if (generatedTags && generatedTags.length) doc.tags = Array.from(new Set([...(doc.tags||[]), ...generatedTags]));
        if (embedding && embedding.length) doc.embedding = embedding;
        await doc.save();
      } catch (aiErr) {
        console.warn('AI step failed on update:', aiErr.message || aiErr);
      }
    }

    res.json(doc);
  } catch (err) { next(err); }
});

// Delete doc: admin any, users own
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Not found' });
    if (String(doc.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await doc.remove();
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Utility endpoints: Summarize with Gemini, Generate Tags with Gemini explicitly
router.post('/:id/summarize', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Not found' });
    const summary = await aiService.summarizeDoc(doc.content);
    if(summary) {
      doc.summary = summary;
      await doc.save();
    }
    res.json(doc);
  } catch (err) { next(err); }
});

router.post('/:id/generate-tags', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Not found' });
    const tags = await aiService.generateTagsDoc(doc.content);
    if(tags && tags.length) {
      doc.tags = Array.from(new Set([...(doc.tags||[]), ...tags]));
      await doc.save();
    }
    res.json(doc);
  } catch (err) { next(err); }
});

module.exports = router;
