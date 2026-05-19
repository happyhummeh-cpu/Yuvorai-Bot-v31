const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  telegramId:      { type: Number, required: true, unique: true, index: true },
  username:        { type: String, default: null },
  firstName:       { type: String, default: '' },
  // Profile
  branch:          { type: String, default: null },
  year:            { type: String, default: null },
  skill:           { type: String, default: null },
  goal:            { type: String, default: null },
  interests:       [String],
  // Identity
  identity:        { type: String, default: 'confused_beginner' },
  auraScore:       { type: Number, default: 0 },
  xp:              { type: Number, default: 0 },
  streak:          { type: Number, default: 0 },
  lastActiveDate:  { type: String, default: null },
  // Plan
  plan:            { type: String, enum: ['free','trial','pro','elite','advanced'], default: 'free' },
  planExpiry:      { type: Date,   default: null },
  // Ad token (for free ad-unlock system)
  adToken:         { type: String, default: null },
  adTokenExpiry:   { type: Date,   default: null },
  // Referral
  referralCode:    { type: String, default: null, unique: true, sparse: true },
  referredBy:      { type: Number, default: null },
  referralCount:   { type: Number, default: 0 },
  // Onboarding state
  onboardingDone:  { type: Boolean, default: false },
  onboardingStep:  { type: Number,  default: 0 },
  // Notification prefs
  notifyOpps:      { type: Boolean, default: true },
  notifyDigest:    { type: Boolean, default: true },
  // Usage totals
  totalAiCalls:    { type: Number, default: 0 },
  totalRoasts:     { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
