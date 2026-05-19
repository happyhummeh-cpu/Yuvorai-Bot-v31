const { Markup } = require('telegraf');
const ai = require('../services/ai.service');
const cache = require('../services/cache.service');

async function tipShow(ctx, user) {
  const key = `tip:${user.telegramId}:${new Date().toISOString().split('T')[0]}`;
  let tip = await cache.get(key);
  if (!tip) { tip = await ai.tip(user); await cache.set(key, tip, 86400); }
  await ctx.reply(`💡 *Daily Career Tip*\n━━━━━━━━━━━━━━━━━━\n${tip}\n━━━━━━━━━━━━━━━━━━`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('💬 Ask AI Coach', 'ask_prompt')],
      [Markup.button.callback('🏠 Dashboard',    'dash_home')],
    ])
  });
}
module.exports = { tipShow };
