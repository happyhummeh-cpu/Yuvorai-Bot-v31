// ── 🔐 Admin Panel ────────────────────────────────────────────────────────────
const User = require('../../models/User');
const Opportunity = require('../../models/Opportunity');
const Payment = require('../../models/Payment');
const env = require('../../config/env');
const logger = require('../../config/logger');

function isAdmin(ctx) { return ctx.from.id === env.telegram.adminId; }

async function adminStats(ctx) {
  if (!isAdmin(ctx)) return;
  const [users, opps, payments, premiumUsers] = await Promise.all([
    User.countDocuments(),
    Opportunity.countDocuments({ isActive: true }),
    Payment.countDocuments({ status: 'pending' }),
    User.countDocuments({ plan: { $ne: 'free' }, planExpiry: { $gt: new Date() } }),
  ]);
  const today = new Date(); today.setHours(0,0,0,0);
  const newToday = await User.countDocuments({ createdAt: { $gte: today } });

  await ctx.reply(
`📊 *YuvorAI Admin Stats*
━━━━━━━━━━━━━━━━━━
👥 Total Users: *${users}*
🆕 New Today: *${newToday}*
💎 Premium Active: *${premiumUsers}*
📡 Active Opportunities: *${opps}*
💰 Pending Payments: *${payments}*
━━━━━━━━━━━━━━━━━━
*Commands:*
/broadcast <msg> — Sab users ko bhejo
/addopp — New opportunity add karo
/pending — Pending payments dekho
/approve_<id> — Payment approve
/reject_<id> — Payment reject`, { parse_mode: 'Markdown' }
  );
}

async function broadcastMsg(ctx, message) {
  if (!isAdmin(ctx)) return;
  const users = await User.find({}, 'telegramId').lean();
  let sent = 0, failed = 0;
  await ctx.reply(`📢 Broadcasting to ${users.length} users...`);
  for (const u of users) {
    try {
      await ctx.telegram.sendMessage(u.telegramId, message, { parse_mode: 'Markdown' });
      sent++;
      if (sent % 30 === 0) await new Promise(r => setTimeout(r, 1000)); // Rate limit
    } catch { failed++; }
  }
  await ctx.reply(`✅ Broadcast done!\nSent: ${sent}\nFailed: ${failed}`);
}

async function pendingPayments(ctx) {
  if (!isAdmin(ctx)) return;
  const payments = await Payment.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(10).lean();
  if (!payments.length) return ctx.reply('No pending payments!');
  for (const p of payments) {
    await ctx.reply(
`💰 *Payment Request*
User: ${p.firstName} (${p.telegramId})
Plan: ${p.plan} — ₹${p.amount}
Time: ${new Date(p.createdAt).toLocaleString('en-IN')}
ID: \`${p._id}\`

/approve_${p._id}
/reject_${p._id}`, { parse_mode: 'Markdown' }
    );
    if (p.screenshotFileId) {
      try { await ctx.replyWithPhoto(p.screenshotFileId); } catch {}
    }
  }
}

async function addOpp(ctx, text) {
  if (!isAdmin(ctx)) return;
  // Format: title|company|location|salary|type|url
  const parts = text.split('|').map(s => s.trim());
  if (parts.length < 6) return ctx.reply('Format: title|company|location|salary|type|url');
  const [title, company, location, salary, type, url] = parts;
  await Opportunity.create({ title, company, location, salary, type, url, source: 'manual', isActive: true });
  await ctx.reply(`✅ Opportunity added!\n${title} @ ${company}`);
}

module.exports = { isAdmin, adminStats, broadcastMsg, pendingPayments, addOpp };
