const { Markup } = require('telegraf');
const ai = require('../services/ai.service');
const cache = require('../services/cache.service');
const { addXP } = require('../utils/helpers');

async function roadmapShow(ctx, user) {
  const cacheKey = `roadmap:${user.telegramId}:${user.goal}`;
  await ctx.reply('🗺️ *Generating your personal roadmap...*\n\n_AI career plan bana raha hai..._ ⚡', { parse_mode: 'Markdown' });
  let roadmap = await cache.get(cacheKey);
  if (!roadmap) { roadmap = await ai.roadmap(user); await cache.set(cacheKey, roadmap, 86400); }
  await addXP(user, 'ask_ai');
  await ctx.reply(`🗺️ *YOUR 6-MONTH ROADMAP*\n━━━━━━━━━━━━━━━━━━\n${roadmap}\n━━━━━━━━━━━━━━━━━━`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📡 Opportunities', 'opps_show')],
      [Markup.button.callback('🏠 Dashboard',     'dash_home')],
    ])
  });
}
module.exports = { roadmapShow };
