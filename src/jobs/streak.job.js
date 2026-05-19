// ── Streak Reminder — 9 PM IST ────────────────────────────────────────────────
const cron = require('node-cron');
const User = require('../models/User');
const logger = require('../config/logger');
let botRef = null;

function startStreakJob(bot) {
  botRef = bot;
  cron.schedule('0 21 * * *', remindStreak, { timezone: 'Asia/Kolkata' });
  logger.info('🔥 Streak reminder scheduled (9 PM IST)');
}

async function remindStreak() {
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Users who haven't used bot today but had streak yesterday (at risk)
  const at_risk = await User.find({
    lastActiveDate: yesterday,
    streak: { $gte: 2 },
    notifyDigest: true,
    onboardingDone: true,
  }).limit(500).lean();

  let sent = 0;
  for (const u of at_risk) {
    try {
      await botRef.telegram.sendMessage(u.telegramId,
        `🔥 *Streak Alert, ${u.firstName}!*\n\nBhai tera *${u.streak} day streak* khatam hone wala hai!\nAaj login nahi kiya abhi tak.\n\nSirf ek command — /tip ya /cooked — streak save ho jaayegi! 💪\n\n_Midnight se pehle karo!_ ⏰`,
        { parse_mode: 'Markdown' }
      );
      sent++;
      if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1000));
    } catch {
      // Silently skip
    }
  }
  logger.info(`Streak reminders sent: ${sent}/${at_risk.length}`);
}

module.exports = { startStreakJob };
