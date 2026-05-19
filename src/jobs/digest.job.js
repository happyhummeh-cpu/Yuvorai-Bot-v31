// ── Daily Digest — 8:00 AM IST ────────────────────────────────────────────────
const cron = require('node-cron');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const cache = require('../services/cache.service');
const env = require('../config/env');
const logger = require('../config/logger');
let botRef = null;

function startDigestJob(bot) {
  botRef = bot;
  cron.schedule('0 8 * * *', sendDigest, { timezone: 'Asia/Kolkata' });
  logger.info('📰 Digest job scheduled (8:00 AM IST daily)');
}

async function sendDigest() {
  const users = await User.find({ notifyDigest: true, onboardingDone: true }).limit(2000).lean();
  const opps  = await Opportunity.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).lean();
  const oppText = opps.map((o, i) => `${i + 1}. *${o.title}* @ ${o.company} — [Apply](${o.url})`).join('\n');
  let sent = 0;

  for (const u of users) {
    try {
      // Every 3rd day — website upsell in digest
      const daysSinceJoin = Math.floor((Date.now() - new Date(u.createdAt)) / 86400000);
      const showUpsell = daysSinceJoin > 0 && daysSinceJoin % 3 === 0;
      const upsellSent = await cache.get(`upsell_sent:${u.telegramId}`);

      const websiteLine = (showUpsell && !upsellSent)
        ? `\n\n🌐 *Pro Tip:* Website pe aur tools hain — Resume Builder, Job Tracker & more!\n[👉 yuvorai-ad-web.vercel.app](https://yuvorai-ad-web.vercel.app/?tid=${u.telegramId}&utm=digest)`
        : '';

      await botRef.telegram.sendMessage(u.telegramId,
        `🌅 *YuvorAI — Good Morning!*\n━━━━━━━━━━━━━━━━━━\n📡 *Today's Top Opportunities:*\n${oppText || 'Aaj koi nahi — refresh karo /feed se!'}\n━━━━━━━━━━━━━━━━━━\n💡 /tip — Aaj ka career tip\n💀 /cooked — Survival check\n⚡ Streak maintain karo!${websiteLine}`,
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );

      if (showUpsell && !upsellSent) {
        await cache.set(`upsell_sent:${u.telegramId}`, '1', 86400 * 7); // 7 din baad reset
      }

      sent++;
      // Rate limit — 30 messages/sec max Telegram
      if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      // Silently skip blocked/deleted users
      if (!err.message?.includes('bot was blocked') && !err.message?.includes('chat not found')) {
        logger.debug('Digest send failed:', err.message);
      }
    }
  }
  logger.info(`Digest sent to ${sent}/${users.length} users`);
}

module.exports = { startDigestJob };
