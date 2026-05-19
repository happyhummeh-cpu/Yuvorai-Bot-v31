// ── YuvorAI Admin API — Dashboard ke liye ─────────────────────────────────────
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Payment = require('../models/Payment');
const env     = require('../config/env');
const cache   = require('../services/cache.service');
const { fetchAndSave } = require('../modules/opportunities/opportunities.service');
const { addXP } = require('../utils/helpers');
const logger  = require('../config/logger');

// ── Simple Token Auth ─────────────────────────────────────────────────────────
const ADMIN_TOKEN = process.env.DASHBOARD_PASSWORD || 'yuvorai_admin_2024';

function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_TOKEN) return res.json({ success: true, token: ADMIN_TOKEN });
  res.status(401).json({ success: false, error: 'Wrong password' });
});

// ── Website Visited — AdGate callback (NO auth needed) ───────────────────────
router.post('/website-visited', async (req, res) => {
  try {
    const { telegramId, timeSpent } = req.body;
    if (!telegramId || !timeSpent || timeSpent < 25) {
      return res.json({ ok: false, reason: 'invalid data' });
    }

    const alreadyRewarded = await cache.get(`web_reward:${telegramId}`);
    if (alreadyRewarded) return res.json({ ok: false, reason: 'already rewarded' });

    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) return res.json({ ok: false, reason: 'user not found' });

    // Give 10 bonus XP
    user.xp += 10;
    await user.save();
    await cache.set(`web_reward:${telegramId}`, '1', 86400 * 30); // 30 din

    // Send thank-you message via bot
    try {
      const { bot } = require('../bot');
      await bot.telegram.sendMessage(
        parseInt(telegramId),
`🎉 *Website explore kiya — shukriya!*

+10 XP mil gaya teri profile mein! ⚡

Ab bhi kuch aur chahiye? Bot pe wapas aa:
💬 /ask — AI Coach
📡 /feed — Fresh opportunities
💀 /cooked — Survival check

_Roz aata reh — roz naya content!_ 🔥`,
        { parse_mode: 'Markdown' }
      );
    } catch (botErr) {
      logger.warn('Could not send reward message:', botErr.message);
    }

    res.json({ ok: true, xpAwarded: 10 });
  } catch (err) {
    logger.error('website-visited error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// All routes below need auth ──────────────────────────────────────────────────
router.use(authMiddleware);

// ── Overview Stats ────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const week  = new Date(Date.now() - 7 * 86400000);

    const [totalUsers, newToday, newWeek, premiumUsers, freeUsers,
      activeOpps, pendingPayments, approvedPayments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ plan: { $ne: 'free' }, planExpiry: { $gt: new Date() } }),
      User.countDocuments({ plan: 'free' }),
      Opportunity.countDocuments({ isActive: true }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'approved' }),
    ]);

    const payments = await Payment.find({ status: 'approved' }).lean();
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthRevenue = payments
      .filter(p => new Date(p.createdAt) >= new Date(Date.now() - 30 * 86400000))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const avgStreakArr = await User.aggregate([{ $group: { _id: null, avg: { $avg: '$streak' } } }]);
    const planDist = await User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]);

    res.json({
      users: { total: totalUsers, newToday, newWeek, premium: premiumUsers, free: freeUsers },
      opportunities: { active: activeOpps },
      payments: { pending: pendingPayments, approved: approvedPayments },
      revenue: { total: totalRevenue, thisMonth: monthRevenue },
      engagement: { avgStreak: Math.round(avgStreakArr[0]?.avg || 0) },
      planDistribution: planDist,
    });
  } catch (err) {
    logger.error('Stats API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Chart Data (last 7 days) ──────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const [users, payments] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: d, $lte: end } }),
        Payment.find({ status: 'approved', createdAt: { $gte: d, $lte: end } }).lean(),
      ]);
      days.push({
        date:    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        users,
        revenue: payments.reduce((s, p) => s + (p.amount || 0), 0),
      });
    }

    // Branch distribution
    const branchDist = await User.aggregate([
      { $match: { branch: { $ne: null } } },
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Goal distribution
    const goalDist = await User.aggregate([
      { $match: { goal: { $ne: null } } },
      { $group: { _id: '$goal', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ dailyStats: days, branchDistribution: branchDist, goalDistribution: goalDist });
  } catch (err) {
    logger.error('Analytics API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Users List ────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const query = search
      ? { $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { username:  { $regex: search, $options: 'i' } },
        ]}
      : {};
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Opportunities ─────────────────────────────────────────────────────────────
router.get('/opportunities', async (req, res) => {
  try {
    const opps = await Opportunity.find({ isActive: true }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ opportunities: opps, total: opps.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/opportunities/refresh', async (req, res) => {
  try {
    const count = await fetchAndSave();
    res.json({ success: true, saved: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/opportunities/:id', async (req, res) => {
  try {
    await Opportunity.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Payments ──────────────────────────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const payments = await Payment.find(status !== 'all' ? { status } : {})
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Broadcast ─────────────────────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const users = await User.find({ onboardingDone: true }, 'telegramId').lean();
    let sent = 0, failed = 0;
    const { bot } = require('../bot');
    for (const u of users) {
      try {
        await bot.telegram.sendMessage(u.telegramId, message, { parse_mode: 'Markdown' });
        sent++;
        if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1000));
      } catch { failed++; }
    }
    res.json({ success: true, sent, failed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── User Plan Update ──────────────────────────────────────────────────────────
router.post('/users/:telegramId/plan', async (req, res) => {
  try {
    const { plan, days } = req.body;
    const expiry = days ? new Date(Date.now() + days * 86400000) : null;
    await User.findOneAndUpdate(
      { telegramId: parseInt(req.params.telegramId) },
      { plan, planExpiry: expiry, planActivatedAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
