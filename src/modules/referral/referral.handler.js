// ── 🎁 Referral System ────────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const User = require('../../models/User');
const env = require('../../config/env');

async function referShow(ctx, user) {
  const link = `https://t.me/${env.telegram.username}?start=ref_${user.referralCode}`;
  await ctx.reply(
`🎁 *Refer & Earn*
━━━━━━━━━━━━━━━━━━
Dosto ko refer karo — XP + rewards kamao!

🔗 *Tera Referral Link:*
${link}

📊 Referrals Done: *${user.referralCount || 0}*

*Rewards:*
• Har successful refer: +20 XP
• 3 refers: 1 week Pro free 🔥
• 10 refers: 1 month Elite free 👑

*Kaise share karo:*
1. Link copy karo
2. Friends ko WhatsApp/Instagram pe bhejo
3. Woh join kare toh XP milega!
━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Copy Code', 'copy_ref')],
        [Markup.button.callback('🏠 Dashboard', 'dash_home')],
      ])
    }
  );
}

async function handleReferral(newUser, refCode) {
  if (!refCode || !newUser) return;
  try {
    const referrer = await User.findOne({ referralCode: refCode });
    if (!referrer || referrer.telegramId === newUser.telegramId) return;
    newUser.referredBy = referrer.telegramId;
    await newUser.save();
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.xp += 20;
    // 3 refers = 7 days Pro
    if (referrer.referralCount === 3) {
      referrer.plan       = 'pro';
      referrer.planExpiry = new Date(Date.now() + 7 * 86400000);
    }
    // 10 refers = 30 days Elite
    if (referrer.referralCount === 10) {
      referrer.plan       = 'elite';
      referrer.planExpiry = new Date(Date.now() + 30 * 86400000);
    }
    await referrer.save();
  } catch {}
}

module.exports = { referShow, handleReferral };
