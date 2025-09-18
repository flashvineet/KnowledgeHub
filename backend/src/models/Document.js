const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  summary: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  embedding: { type: [Number] } // store vector as array - for brute force similarity
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
