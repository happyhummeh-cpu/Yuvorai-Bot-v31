// ── 💎 Premium Plans + UPI Payment ───────────────────────────────────────────
const { Markup } = require('telegraf');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const cache = require('../../services/cache.service');
const env = require('../../config/env');
const { PLANS } = require('../../config/constants');
const { effectivePlan } = require('../../utils/helpers');
const logger = require('../../config/logger');

async function premiumShow(ctx, user) {
  const current = effectivePlan(user);
  const expiry  = user.planExpiry ? new Date(user.planExpiry).toLocaleDateString('en-IN') : null;

  await ctx.reply(
`💎 *YuvorAI Premium Plans*
━━━━━━━━━━━━━━━━━━
Current: ${PLANS[current]?.label} ${expiry ? `(expires ${expiry})` : ''}

🆓 *Free* — ₹0
• 3 AI chats/day, 1 resume roast
• 5 opportunities/day

⚡ *Trial* — ₹9 (7 din)
• 10 AI chats/day, 5 roasts
• 15 opportunities/day, 1 interview/day

💎 *Pro* — ₹19/month
• 30 AI chats/day, unlimited roasts
• 50 opportunities, 3 interviews/day

🔥 *Elite* — ₹39/month
• 100 AI chats/day, sab unlimited
• Priority opportunities, all features

👑 *Advanced* — ₹69/month
• EVERYTHING unlimited
• Exclusive features + early access
━━━━━━━━━━━━━━━━━━
_Payment: UPI screenshot bhejo — 30 min mein activate!_`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⚡ Trial — ₹9',   'buy_trial')],
        [Markup.button.callback('💎 Pro — ₹19',    'buy_pro'),    Markup.button.callback('🔥 Elite — ₹39', 'buy_elite')],
        [Markup.button.callback('👑 Advanced — ₹69','buy_advanced')],
        [Markup.button.callback('🏠 Back',          'dash_home')],
      ])
    }
  );
}

async function buyPlan(ctx, user, planKey) {
  const plan = PLANS[planKey];
  if (!plan) return;

  const msg =
`💳 *Payment — ${plan.label}*
━━━━━━━━━━━━━━━━━━
Amount: *₹${plan.price}*
Duration: *${plan.days ? plan.days + ' days' : 'Forever'}*

📲 *UPI Payment:*
UPI ID: \`${env.payment.upiId}\`
Name: ${env.payment.upiName}

*Steps:*
1. UPI app open karo
2. Send ₹${plan.price} to above UPI ID
3. Payment screenshot yahan bhejo
4. 30 min mein activate ho jaayega ✅
━━━━━━━━━━━━━━━━━━
_Koi issue? Admin se baat karo_ /help`;

  await cache.set(`paying:${user.telegramId}`, planKey, 1800);
  await cache.set(`waiting:${user.telegramId}`, 'payment_ss', 1800);

  // Send QR if available
  if (env.payment.qrUrl) {
    try {
      await ctx.replyWithPhoto(env.payment.qrUrl, { caption: msg, parse_mode: 'Markdown' });
      return;
    } catch {}
  }
  await ctx.reply(msg, { parse_mode: 'Markdown' });
}

async function handlePaymentScreenshot(ctx, user, fileId) {
  const planKey = await cache.get(`paying:${user.telegramId}`);
  if (!planKey) return ctx.reply('Session expire ho gayi. /plan se dobara try karo.');
  await cache.del(`paying:${user.telegramId}`);
  await cache.del(`waiting:${user.telegramId}`);
  const plan = PLANS[planKey];

  const payment = await Payment.create({
    telegramId:       user.telegramId,
    firstName:        user.firstName,
    plan:             planKey,
    amount:           plan.price,
    screenshotFileId: fileId,
  });

  await ctx.reply(
`✅ *Payment proof mil gaya!*

Plan: ${plan.label}
Amount: ₹${plan.price}
Status: ⏳ Pending review

_Admin 30 min mein verify karega._
_Activate hone pe message aayega!_ 🚀

Payment ID: \`${payment._id}\``,
    { parse_mode: 'Markdown' }
  );

  // Notify admin
  try {
    await ctx.telegram.sendPhoto(env.telegram.adminId, fileId, {
      caption:
`💰 *New Payment Request!*
User: ${user.firstName} (@${user.username || 'no username'})
ID: ${user.telegramId}
Plan: ${plan.label} — ₹${plan.price}
Payment ID: \`${payment._id}\`

/approve_${payment._id}
/reject_${payment._id}`,
      parse_mode: 'Markdown',
    });
  } catch (err) { logger.error('Admin notify failed:', err); }
}

// Admin approve/reject
async function approvePayment(ctx, paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) return ctx.reply('Payment not found.');
  if (payment.status !== 'pending') return ctx.reply(`Already ${payment.status}.`);
  const plan = PLANS[payment.plan];
  payment.status     = 'approved';
  payment.approvedBy = ctx.from.id;
  payment.approvedAt = new Date();
  await payment.save();
  const expiry = plan.days ? new Date(Date.now() + plan.days * 86400000) : null;
  await User.findOneAndUpdate({ telegramId: payment.telegramId }, {
    plan: payment.plan, planExpiry: expiry, planActivatedAt: new Date()
  });
  await ctx.reply(`✅ Approved! User ${payment.telegramId} — ${plan.label}`);
  try {
    await ctx.telegram.sendMessage(payment.telegramId,
`🎉 *Payment Approved!*

Bhai welcome to *${plan.label}*! 🚀
Tera account activate ho gaya — ab sab features unlock hain.

${plan.days ? `Expiry: ${new Date(Date.now() + plan.days * 86400000).toLocaleDateString('en-IN')}` : ''}

Koi bhi problem ho toh seedha bata! 💪`,
      { parse_mode: 'Markdown' }
    );
  } catch {}
}

async function rejectPayment(ctx, paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) return ctx.reply('Payment not found.');
  payment.status = 'rejected'; await payment.save();
  await ctx.reply(`❌ Rejected: ${payment.telegramId}`);
  try {
    await ctx.telegram.sendMessage(payment.telegramId,
`❌ *Payment Rejected*

Bhai kuch issue tha screenshot mein.
Dobara try karo ya /help mein contact karo.`, { parse_mode: 'Markdown' });
  } catch {}
}

module.exports = { premiumShow, buyPlan, handlePaymentScreenshot, approvePayment, rejectPayment };
