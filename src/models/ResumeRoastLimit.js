const mongoose = require('mongoose');

const resumeRoastLimitSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  date: { type: String, required: true },
  userType: { type: String, enum: ['free', 'trial', 'pro', 'elite', 'advanced'], default: 'free' },
  count: { type: Number, default: 0 },
  limit: { type: Number, required: true },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
});

resumeRoastLimitSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('ResumeRoastLimit', resumeRoastLimitSchema);