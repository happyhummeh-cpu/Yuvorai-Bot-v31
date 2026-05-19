const { IDENTITIES, PLANS, XP } = require('../config/constants');
const User = require('../models/User');
const logger = require('../config/logger');

// Safe Telegram reply — never crashes
async function safeReply(ctx, text, extra = {}) {
  try { return await ctx.reply(text, { parse_mode: 'Markdown', ...extra }); }
  catch { try { return await ctx.reply(text.replace(/[*_`[\]()~>#+=|{}.!]/g, '\\$&'), extra); } catch {} }
}

// Get or create user
async function getOrCreateUser(ctx) {
  const id = ctx.from.id;
  let user = await User.findOne({ telegramId: id });
  if (!user) {
    user = await User.create({
      telegramId: id,
      username:   ctx.from.username || null,
      firstName:  ctx.from.first_name || 'Bhai',
      referralCode: `YUV${id.toString().slice(-4)}${Math.random().toString(36).slice(-3).toUpperCase()}`,
    });
  }
  return user;
}

// Check if premium active
function isPremium(user) {
  if (!user.plan || user.plan === 'free') return false;
  if (!user.planExpiry) return false;
  return new Date(user.planExpiry) > new Date();
}

// Effective plan (free if expired)
function effectivePlan(user) {
  return isPremium(user) ? user.plan : 'free';
}

// Assign identity based on aura score
function assignIdentity(auraScore) {
  for (const id of IDENTITIES) {
    if (auraScore >= id.min) return id;
  }
  return IDENTITIES[IDENTITIES.length - 1];
}

// Calculate aura score
function calcAura(user) {
  let score = 0;
  if (user.branch)   score += 8;
  if (user.year)     score += 7;
  if (user.skill)    score += 7;
  if (user.goal)     score += 8;
  // Skill level bonus
  if (user.skill === 'Advanced')     score += 15;
  else if (user.skill === 'Intermediate') score += 8;
  // Streak
  score += Math.min(user.streak * 2, 20);
  // XP
  score += Math.min(Math.floor(user.xp / 50), 25);
  return Math.min(score, 100);
}

// Add XP + update streak + identity
async function addXP(user, action) {
  const gain = XP[action] || 0;
  if (!gain) return user;
  user.xp += gain;
  user.totalAiCalls = (user.totalAiCalls || 0) + (action === 'ask_ai' ? 1 : 0);
  // Streak check
  const today = new Date().toISOString().split('T')[0];
  if (user.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    user.streak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;
    user.lastActiveDate = today;
  }
  // Recalculate aura + identity
  user.auraScore = calcAura(user);
  const id = assignIdentity(user.auraScore);
  user.identity = id.id;
  await user.save();
  return user;
}

// Progress bar
function bar(val, max, len = 10) {
  const f = Math.round(Math.min(val / max, 1) * len);
  return '█'.repeat(f) + '░'.repeat(len - f);
}

// Plan label
function planLabel(user) {
  const p = effectivePlan(user);
  return PLANS[p]?.label || '🆓 Free';
}

module.exports = { safeReply, getOrCreateUser, isPremium, effectivePlan, assignIdentity, calcAura, addXP, bar, planLabel };
