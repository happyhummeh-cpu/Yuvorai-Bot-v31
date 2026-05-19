// ── Website Upsell Handler ────────────────────────────────────────────────────
const { Markup } = require('telegraf');
const cache = require('../services/cache.service');
const env = require('../config/env');

const WEBSITE_URL = env.app.websiteUrl || 'https://yuvorai-ad-web.vercel.app';

async function sendWebsiteUpsell(user, bot) {
  try {
    const alreadySent = await cache.get(`upsell_sent:${user.telegramId}`);
    if (alreadySent) return;

    const url = `${WEBSITE_URL}?tid=${user.telegramId}&utm=bot`;

    await bot.telegram.sendMessage(
      user.telegramId,
`🌐 *Ek kaam kar bhai!*

Bot pe sab milta hai — par website pe kuch exclusive hai:

✅ Resume Builder (full)
✅ Job Application Tracker
✅ Placement stats by company
✅ Company-wise interview questions
✅ Community tools

*30 second dekh le — free hai, kuch buy nahi karna.*
Sirf scroll karo aur wapas aa jao 👇`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.url('🌐 Website Pe Jao (30 sec)', url)],
          [Markup.button.callback('Later dekhunga', 'upsell_dismiss')],
        ]),
      }
    );

    // Mark as sent — 7 din baad phir trigger ho sakta hai
    await cache.set(`upsell_sent:${user.telegramId}`, '1', 86400 * 7);
  } catch (err) {
    // Silently fail
  }
}

module.exports = { sendWebsiteUpsell };
