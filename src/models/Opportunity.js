const mongoose = require('mongoose');
const oppSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  company:     { type: String, required: true },
  location:    { type: String, default: 'Remote' },
  salary:      { type: String, default: 'Not disclosed' },
  type:        { type: String, enum: ['internship','job','hackathon','fellowship','remote'], default: 'internship' },
  url:         { type: String, required: true },
  source:      { type: String, default: 'manual' },
  description: { type: String, default: '' },
  deadline:    { type: Date,   default: null },
  isActive:    { type: Boolean, default: true },
  tags:        [String],
  branches:    [String],
}, { timestamps: true });
oppSchema.index({ isActive: 1, createdAt: -1 });
module.exports = mongoose.model('Opportunity', oppSchema);
